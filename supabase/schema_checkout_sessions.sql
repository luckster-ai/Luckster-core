-- ECPay Checkout Session flow: "no successful payment, no Order".
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema_payment_core.sql,
-- schema_refund.sql (service_periods_no_overlap) and
-- schema_contract_review.sql (contract_acceptances) have already been run.
--
-- What changes (ECPay only -- the Oen path is untouched):
--   Before: create-order-checkout inserted a pending_payment Order first,
--           and ecpay-webhook later flipped it to paid (apply_order_payment).
--   After:  create-order-checkout inserts a checkout_sessions row instead
--           (a temporary "this member is paying" marker -- NOT an Order,
--           NOT a purchase). Only once ECPay's payment is verified does
--           fulfill_checkout_session() create the Order -- already 'paid'
--           -- and its Service Period, in one transaction.
--
-- SCOPE:
--   1. checkout_sessions                -- new table (+ RLS: read own / admin)
--   2. create_checkout_session(...)     -- new trusted RPC (start of purchase)
--   3. fulfill_checkout_session(...)    -- new trusted RPC (payment verified)
--
-- Deliberately NOT changed: orders / service_periods / payment_events
-- schema, apply_order_payment() and every other existing RPC. A paid Order
-- created here carries exactly the fields the existing refund flow
-- (terminate-service-period -> refundViaEcpay) reads: provider,
-- provider_checkout_ref (MerchantTradeNo), provider_ref (TradeNo),
-- payment_method, amount, plan_code, contract_acceptance_id /
-- contract_version.
--
-- Existing pending_payment Orders (historic TEST data) are ignored by
-- everything in this file -- neither RPC reads `orders` for eligibility.
--
-- No Continue / Retry / Cancel, no cleanup job: an unpaid session simply
-- stops counting as "in progress" once expires_at passes. A session paid
-- AFTER expires_at is still fulfilled if the member has no valid Service
-- Period at that moment (the money has been taken and the price/contract
-- were locked into the session when it was signed); if they do, the
-- session is rejected and left for manual refund.

-- =====================================================================
-- 1. checkout_sessions
-- =====================================================================
create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  provider text not null check (provider in ('ecpay')),
  -- ECPay MerchantTradeNo: max 20 alphanumerics, never reusable. The key
  -- ecpay-webhook resolves the session by.
  merchant_trade_no text not null unique,
  -- Locked at session creation (server-side price + the member's Contract
  -- Acceptance at that moment); copied verbatim into the Order.
  plan_code text not null check (plan_code in ('monthly', 'annual')),
  amount integer not null check (amount > 0),
  currency text not null default 'TWD' check (currency = 'TWD'),
  contract_acceptance_id uuid not null references public.contract_acceptances (id),
  contract_version text not null,
  -- open      -- created, payment not (yet) verified
  -- fulfilled -- payment verified, Order + Service Period created
  -- rejected  -- payment verified but NOT fulfilled (e.g. the member
  --              already had a valid Service Period) -> manual refund
  status text not null default 'open' check (status in ('open', 'fulfilled', 'rejected')),
  -- Only governs "is a purchase in progress" (blocks a second session);
  -- it does NOT stop a late payment from being fulfilled (see header).
  expires_at timestamptz not null,
  order_id uuid unique references public.orders (id),
  provider_ref text,
  payment_method text,
  reject_reason text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists checkout_sessions_user_status_idx
  on public.checkout_sessions (user_id, status);

alter table public.checkout_sessions enable row level security;

drop policy if exists "checkout_sessions: read own" on public.checkout_sessions;
create policy "checkout_sessions: read own"
  on public.checkout_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "checkout_sessions: admin read all" on public.checkout_sessions;
create policy "checkout_sessions: admin read all"
  on public.checkout_sessions for select
  using (public.is_admin());
-- No INSERT / UPDATE / DELETE policy: only the two RPCs below
-- (service_role, SECURITY DEFINER) ever write here.

-- =====================================================================
-- 2. create_checkout_session(...)
--    Called by create-order-checkout (ECPay branch) AFTER it has checked
--    the Contract Acceptance Gate, priced the plan and signed the ECPay
--    form (which is why id and merchant_trade_no come in as parameters).
--
--    Per-member advisory lock (same key as fulfill_checkout_session) so
--    two concurrent "buy" clicks cannot both pass the checks below.
--    Raises:
--      active_service_period_exists  -- any non-terminated period that
--                                       has not ended yet (current or
--                                       future-dated)
--      checkout_session_in_progress  -- an open session with
--                                       expires_at > now()
-- =====================================================================
create or replace function public.create_checkout_session(
  p_id uuid,
  p_user_id uuid,
  p_provider text,
  p_merchant_trade_no text,
  p_plan_code text,
  p_amount integer,
  p_currency text,
  p_contract_acceptance_id uuid,
  p_contract_version text
)
returns public.checkout_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.checkout_sessions;
begin
  perform pg_advisory_xact_lock(hashtextextended('checkout:' || p_user_id::text, 0));

  if exists (
    select 1 from public.service_periods
    where user_id = p_user_id
      and terminated_at is null
      and service_period_end > now()
  ) then
    raise exception 'active_service_period_exists';
  end if;

  if exists (
    select 1 from public.checkout_sessions
    where user_id = p_user_id
      and status = 'open'
      and expires_at > now()
  ) then
    raise exception 'checkout_session_in_progress';
  end if;

  insert into public.checkout_sessions (
    id, user_id, provider, merchant_trade_no, plan_code, amount, currency,
    contract_acceptance_id, contract_version, expires_at
  ) values (
    p_id, p_user_id, p_provider, p_merchant_trade_no, p_plan_code, p_amount,
    p_currency, p_contract_acceptance_id, p_contract_version,
    -- "Purchase in progress" window (confirmed: 30 minutes).
    now() + interval '30 minutes'
  )
  returning * into v_session;

  return v_session;
end;
$$;

revoke execute on function public.create_checkout_session(uuid, uuid, text, text, text, integer, text, uuid, text)
  from public, anon, authenticated;
grant execute on function public.create_checkout_session(uuid, uuid, text, text, text, integer, text, uuid, text)
  to service_role;

-- =====================================================================
-- 3. fulfill_checkout_session(...)
--    The ONE place a verified ECPay payment becomes an Order + Service
--    Period. Called by both ecpay-webhook and confirm-checkout-session,
--    only AFTER the caller has verified the payment via QueryTradeInfo.
--
--    Idempotent and race-safe:
--      - the session row is locked FOR UPDATE, so duplicate webhooks /
--        webhook-vs-confirm for the same session run one after another,
--        and the second sees status <> 'open'
--      - the per-member advisory lock serialises different sessions of
--        the same member (two tabs both paid -> first fulfilled, second
--        rejected)
--
--    Never raises for a business outcome (a raise would make ECPay resend
--    forever, the known 23P01 problem of the old path); returns jsonb:
--      { "outcome": "fulfilled" | "already_fulfilled" | "rejected" | "not_found",
--        "order_id": uuid | null, "reason": text | null }
-- =====================================================================
create or replace function public.fulfill_checkout_session(
  p_merchant_trade_no text,
  p_provider text,
  p_provider_ref text,
  p_payment_method text,
  p_verified_amount integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.checkout_sessions;
  v_order_id uuid;
  v_reason text;
begin
  select * into v_session
  from public.checkout_sessions
  where merchant_trade_no = p_merchant_trade_no
    and provider = p_provider
  for update;

  if not found then
    return jsonb_build_object('outcome', 'not_found', 'order_id', null, 'reason', null);
  end if;

  if v_session.status = 'fulfilled' then
    return jsonb_build_object('outcome', 'already_fulfilled', 'order_id', v_session.order_id, 'reason', null);
  end if;
  if v_session.status = 'rejected' then
    return jsonb_build_object('outcome', 'rejected', 'order_id', null, 'reason', v_session.reject_reason);
  end if;

  perform pg_advisory_xact_lock(hashtextextended('checkout:' || v_session.user_id::text, 0));

  if p_verified_amount is distinct from v_session.amount then
    v_reason := 'amount_mismatch';
  elsif exists (
    select 1 from public.service_periods
    where user_id = v_session.user_id
      and terminated_at is null
      and service_period_end > now()
  ) then
    v_reason := 'active_service_period_exists';
  end if;

  if v_reason is null then
    begin
      insert into public.orders (
        user_id, contract_acceptance_id, contract_version, plan_code,
        amount, currency, status, payment_attempt,
        -- NOT NULL column from the pending-Order design; there is no
        -- payment window any more, so it records the moment payment was
        -- verified.
        payment_expires_at,
        provider, provider_checkout_ref, provider_ref, payment_method
      ) values (
        v_session.user_id, v_session.contract_acceptance_id, v_session.contract_version,
        v_session.plan_code, v_session.amount, v_session.currency, 'paid', 1,
        now(),
        v_session.provider, v_session.merchant_trade_no, p_provider_ref, p_payment_method
      )
      returning id into v_order_id;

      insert into public.service_periods (
        order_id, user_id, plan_code, service_period_start, service_period_end
      ) values (
        v_order_id, v_session.user_id, v_session.plan_code, now(),
        now() + case v_session.plan_code
          when 'monthly' then interval '1 month'
          when 'annual' then interval '1 year'
        end
      );
    exception when exclusion_violation then
      -- service_periods_no_overlap backstop; the inner block's Order
      -- insert is rolled back with it.
      v_order_id := null;
      v_reason := 'service_period_overlap';
    end;
  end if;

  if v_reason is not null then
    update public.checkout_sessions
    set status = 'rejected',
        provider_ref = p_provider_ref,
        payment_method = p_payment_method,
        reject_reason = v_reason,
        resolved_at = now()
    where id = v_session.id;
    return jsonb_build_object('outcome', 'rejected', 'order_id', null, 'reason', v_reason);
  end if;

  update public.checkout_sessions
  set status = 'fulfilled',
      order_id = v_order_id,
      provider_ref = p_provider_ref,
      payment_method = p_payment_method,
      resolved_at = now()
  where id = v_session.id;

  return jsonb_build_object('outcome', 'fulfilled', 'order_id', v_order_id, 'reason', null);
end;
$$;

revoke execute on function public.fulfill_checkout_session(text, text, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.fulfill_checkout_session(text, text, text, text, integer)
  to service_role;
