-- Payment Rebuild -- Step 9: Refund / Cancellation / Edge Cases.
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema_payment_core.sql
-- (orders / service_periods) and schema_membership_entitlement.sql have
-- already been run.
--
-- SCOPE (Step 9, this round only -- per the confirmed Design):
--   1. apply_order_payment()  -- DROP + CREATE (not CREATE OR REPLACE --
--      see note below), adds an OPTIONAL trailing p_service_period_start
--      parameter so a future caller (Plan Change's "到期後開始" / a
--      same-plan repurchase while the current period is still active --
--      neither implemented this round) can request a future-dated Service
--      Period. Existing callers (Step 7's oen-webhook) pass only the
--      original 6 arguments and are completely unaffected: the parameter
--      defaults to NULL, which resolves to the exact same now()-based
--      behaviour as before.
--   2. apply_service_period_early_termination(...)  -- NEW trusted RPC.
--      Member-initiated only (payment-legal-spec.md §11 / contract 第十一
--      條). Computes the refund amount and transitions the Order into
--      refund_processing in one atomic step; does NOT call any Provider
--      API itself (that is the calling Edge Function's job, after this
--      RPC's DB transaction has committed).
--   3. mark_refund_processed(...) / mark_refund_failed(...)  -- NEW small
--      trusted RPCs. The terminal state transitions out of
--      refund_processing, called by the Edge Function AFTER it has
--      independently confirmed the Provider's refund result (clean
--      response, or a re-query on network-level ambiguity).
--   4. service_periods_no_overlap  -- NEW EXCLUDE constraint (requires
--      btree_gist). Database-level backstop: no two non-terminated rows
--      for the same user may have overlapping [service_period_start,
--      service_period_end) windows, regardless of which code path or
--      future bug produced them.
--
-- Explicitly OUT of scope for this file (confirmed boundaries for this
-- round, not oversight):
--   - No actual caller passes a non-NULL p_service_period_start yet --
--     that is Plan Change's "到期後開始" flow / a same-plan repurchase
--     flow, neither built this round. This file only adds the CAPABILITY.
--   - No Basic Agreement Termination Record (Decision 10 in
--     order-schema-proposal.md) -- separate, independent of Order/Service
--     Period, not touched here.
--   - No 第二十條 (violation-based, no-refund) termination path -- this
--     file's RPC is the 第十一條 member-initiated-with-refund path only.
--   - No refund_failed retry policy -- "refund_failed" is a terminal
--     resting state this round, per explicit instruction; retry policy
--     stays an open question, not decided here.
--
-- Refund amount formula (payment-legal-spec.md §11 / contract 第十一條,
-- not redesigned, implemented verbatim):
--   Monthly: refund = 已付款金額(orders.amount) - (已提供服務日數 × 11),
--     clamped to [0, orders.amount]. 11 = 333 ÷ 30 per the contract's own
--     worked figure (NOT derived from orders.amount -- see annual note
--     below for why these are literal contract constants, matching the
--     existing PLAN_PRICING table in create-order-checkout/index.ts, which
--     has the same hardcoded-price characteristic and the same caveat if
--     prices ever change).
--   Annual: 已提供服務費用 = (已提供完整月份數 × 333) + (不足一個月之天數 × 11);
--     refund = 3,333 - 已提供服務費用, clamped to [0, orders.amount]. Per
--     the contract's own wording, the annual formula's base is the literal
--     "新臺幣 3,333 元" (NOT "已付款金額" the way the monthly formula
--     explicitly says) -- this asymmetry is in the contract text itself,
--     not invented here.
--   "已提供服務日數" (monthly): whole days elapsed from
--     service_period_start to the termination request instant (now()),
--     floor-rounded -- a partially-elapsed day is not counted as provided.
--     This specific rounding rule is an implementation choice within the
--     confirmed formula (the contract does not spell out sub-day
--     rounding); flagged for awareness, not re-opened as a business
--     question.

-- =====================================================================
-- 1. apply_order_payment()  -- DROP + CREATE (see header)
--
-- CREATE OR REPLACE cannot be used here: Postgres identifies a function by
-- name + parameter TYPE list, so a replace that ADDS a parameter (even
-- with a default) creates a second, overloaded function instead of
-- replacing the original -- existing 6-argument callers would keep
-- resolving to the untouched original and never see the new capability.
-- DROP + CREATE collapses this back to a single function under the
-- original name, with the new parameter optional.
-- =====================================================================
drop function if exists public.apply_order_payment(uuid, integer, text, text, text, integer);

create function public.apply_order_payment(
  p_order_id uuid,
  p_payment_attempt integer,
  p_provider text,
  p_provider_ref text,
  p_payment_method text,
  p_verified_amount integer,
  p_service_period_start timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
  v_period_start timestamptz;
begin
  update public.orders
  set status = 'paid',
      provider_ref = p_provider_ref,
      payment_method = p_payment_method,
      updated_at = now()
  where id = p_order_id
    and status = 'pending_payment'
    and payment_attempt = p_payment_attempt
    and payment_expires_at > now()
    and provider = p_provider
    and amount = p_verified_amount
  returning * into v_order;

  if not found then
    raise exception 'order_not_eligible_for_payment';
  end if;

  v_period_start := coalesce(p_service_period_start, now());

  insert into public.service_periods (
    order_id, user_id, plan_code, service_period_start, service_period_end
  ) values (
    v_order.id, v_order.user_id, v_order.plan_code, v_period_start,
    v_period_start + case v_order.plan_code
      when 'monthly' then interval '1 month'
      when 'annual' then interval '1 year'
    end
  );
end;
$$;

revoke execute on function public.apply_order_payment(uuid, integer, text, text, text, integer, timestamptz)
  from public, anon, authenticated;
grant execute on function public.apply_order_payment(uuid, integer, text, text, text, integer, timestamptz)
  to service_role;

-- =====================================================================
-- 2. apply_service_period_early_termination(p_service_period_id, p_user_id)
--
--    Member-initiated early termination (第十一條), NOT the violation path
--    (第二十條 -- different legal basis, no refund, out of scope). Atomic:
--    re-validates the Service Period is currently valid (not already
--    terminated, not already expired) at the moment of the call -- does
--    not trust any earlier client-side check -- then computes the refund
--    and moves the Order into refund_processing, all in one transaction.
--    Does NOT call any Provider API; that happens afterwards, outside this
--    RPC, once this transaction has committed (see schema_refund.sql
--    header and the terminate-service-period Edge Function).
-- =====================================================================
create or replace function public.apply_service_period_early_termination(
  p_service_period_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_period public.service_periods;
  v_order public.orders;
  v_days_provided integer;
  v_age interval;
  v_full_months integer;
  v_remainder_days integer;
  v_service_cost integer;
  v_refund integer;
begin
  -- Atomic guard: only a currently-active (per the same double-bound
  -- window Step 8's entitlement formula uses), not-yet-terminated Service
  -- Period owned by the caller can be terminated this way.
  update public.service_periods
  set terminated_at = now()
  where id = p_service_period_id
    and user_id = p_user_id
    and terminated_at is null
    and now() >= service_period_start
    and now() < service_period_end
  returning * into v_period;

  if not found then
    raise exception 'service_period_not_eligible_for_termination';
  end if;

  select * into v_order from public.orders where id = v_period.order_id;
  if not found then
    raise exception 'order_not_found_for_service_period';
  end if;

  if v_period.plan_code = 'monthly' then
    v_days_provided := floor(extract(epoch from (now() - v_period.service_period_start)) / 86400)::integer;
    v_refund := greatest(0, least(v_order.amount, v_order.amount - (v_days_provided * 11)));
  elsif v_period.plan_code = 'annual' then
    v_age := age(now(), v_period.service_period_start);
    v_full_months := extract(year from v_age)::integer * 12 + extract(month from v_age)::integer;
    v_remainder_days := extract(day from v_age)::integer;
    v_service_cost := (v_full_months * 333) + (v_remainder_days * 11);
    v_refund := greatest(0, least(v_order.amount, 3333 - v_service_cost));
  else
    raise exception 'unknown_plan_code: %', v_period.plan_code;
  end if;

  -- Refund amount is fixed HERE and never recalculated later -- the
  -- refund_processing -> refunded/refund_failed transitions below only
  -- ever report or retry against this already-computed refund_amount.
  update public.orders
  set status = 'refund_processing',
      refund_requested_at = now(),
      refund_amount = v_refund,
      refund_calculated_at = now(),
      updated_at = now()
  where id = v_order.id
    and status = 'paid';

  if not found then
    raise exception 'order_not_eligible_for_refund';
  end if;
end;
$$;

revoke execute on function public.apply_service_period_early_termination(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.apply_service_period_early_termination(uuid, uuid)
  to service_role;

-- =====================================================================
-- 3. mark_refund_processed(p_order_id, p_provider_refund_ref)
--    mark_refund_failed(p_order_id, p_provider_refund_error)
--
--    The two terminal transitions out of refund_processing. Both are
--    idempotent via the same status-guard-in-WHERE-clause pattern as
--    every other trusted RPC in this file -- calling either twice for the
--    same Order safely no-ops the second time via the exception path
--    (caller already treats "not found" as a terminal, non-retried
--    outcome, same as apply_order_payment()'s existing callers do).
--
--    refund_failed is a RESTING terminal state this round -- no retry
--    workflow is implemented or assumed here, per explicit instruction.
-- =====================================================================
create or replace function public.mark_refund_processed(
  p_order_id uuid,
  p_provider_refund_ref text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'refunded',
      provider_refund_ref = p_provider_refund_ref,
      refund_processed_at = now(),
      updated_at = now()
  where id = p_order_id
    and status = 'refund_processing';

  if not found then
    raise exception 'order_not_eligible_for_refund_completion';
  end if;
end;
$$;

revoke execute on function public.mark_refund_processed(uuid, text)
  from public, anon, authenticated;
grant execute on function public.mark_refund_processed(uuid, text)
  to service_role;

create or replace function public.mark_refund_failed(
  p_order_id uuid,
  p_provider_refund_error text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'refund_failed',
      provider_refund_error = p_provider_refund_error,
      updated_at = now()
  where id = p_order_id
    and status = 'refund_processing';

  if not found then
    raise exception 'order_not_eligible_for_refund_failure_marking';
  end if;
end;
$$;

revoke execute on function public.mark_refund_failed(uuid, text)
  from public, anon, authenticated;
grant execute on function public.mark_refund_failed(uuid, text)
  to service_role;

-- =====================================================================
-- 4. service_periods_no_overlap  -- DB-level backstop
--
--    No two non-terminated service_periods rows for the same user may
--    have overlapping [service_period_start, service_period_end) windows.
--    The `where (terminated_at is null)` predicate is essential: an
--    early-terminated period must NOT continue to block new periods from
--    being created over its original (now-moot) remaining window -- only
--    rows that are still genuinely in force participate in the exclusion.
--
--    This is a backstop, not the primary mechanism -- correct behaviour
--    still depends on callers computing the right service_period_start
--    (see apply_order_payment()'s new parameter above) and, for Immediate
--    Change, terminating the old period before starting the new one. This
--    constraint exists because that correctness is enforced by caller
--    discipline today, not by the database, and there is now more than
--    one code path computing a start time.
-- =====================================================================
create extension if not exists btree_gist;

alter table public.service_periods
  drop constraint if exists service_periods_no_overlap;

alter table public.service_periods
  add constraint service_periods_no_overlap
  exclude using gist (
    user_id with =,
    tstzrange(service_period_start, service_period_end, '[)') with &&
  )
  where (terminated_at is null);
