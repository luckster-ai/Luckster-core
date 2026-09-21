-- JOTI Payment Rebuild -- Step 5: Payment Core / Provider Adapter
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema_contract_review.sql
-- has already been run (orders.contract_acceptance_id references
-- contract_acceptances). Safe to re-run (all statements are idempotent).
--
-- SCOPE (Step 5 only -- see supabase/schema_payment_core_ROLLBACK.sql and
-- docs/business/payment/order-schema-proposal.md for the full design):
--   1. orders                    -- Order lifecycle, 7-value status, retry
--                                    via payment_attempt, refund fields
--                                    folded in (not yet driven by any RPC --
--                                    that is Step 9)
--   2. service_periods           -- created only by apply_order_payment()
--   3. payment_events.order_id   -- additive column (Step 6/7 will populate
--                                    it; not written by anything in Step 5)
--   4. apply_order_payment()     -- Core-owned "payment verified" state
--                                    transition. Callable by any future
--                                    Provider Adapter's webhook handler --
--                                    Step 5 defines and tests it without any
--                                    real provider calling it yet.
--   5. mark_payment_failed()     -- Core-owned "payment failed" transition
--   6. retry_order_payment()     -- Core-owned payment_failed -> pending_payment
--   7. expire_pending_orders()   -- Core-owned payment_expires_at sweep
--                                    (function only; no cron scheduling is
--                                    set up in this phase)
--
-- Explicitly OUT of scope for this file (by design, not oversight):
--   - No Provider Adapter, no Oen-specific code anywhere in this file.
--   - No refund-lifecycle RPCs (refund_processing/refunded/refund_failed
--     transitions) -- that is Step 9. The status values exist in the CHECK
--     constraint because order-schema-proposal.md already finalized the
--     7-value enum, but nothing in this file drives those transitions.
--   - No "does requires_reacceptance block new Orders" logic anywhere --
--     the Contract Acceptance Gate below is an EXISTENCE check only.

-- =====================================================================
-- 1. orders
-- =====================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  contract_acceptance_id uuid not null references public.contract_acceptances (id),
  contract_version text not null,
  plan_code text not null check (plan_code in ('monthly', 'annual')),
  amount integer not null check (amount > 0),
  currency text not null default 'TWD' check (currency = 'TWD'),
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'paid', 'payment_failed', 'payment_expired',
    'refund_processing', 'refund_failed', 'refunded'
  )),
  payment_attempt integer not null default 1,
  payment_expires_at timestamptz not null,
  -- Deliberately NULLABLE, no default: Payment Core does not know or
  -- decide which provider handles an Order -- that is chosen by whichever
  -- Provider Adapter actually starts a checkout attempt (Step 6+). This
  -- column stays NULL for every Order Step 5 creates; Step 6's Adapter is
  -- responsible for setting it when it calls the provider's checkout API.
  provider text,
  provider_checkout_ref text,
  provider_ref text,
  payment_method text,
  refund_requested_at timestamptz,
  refund_amount integer,
  refund_calculated_at timestamptz,
  provider_refund_ref text,
  provider_refund_error text,
  refund_processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration step for a table that may already exist from an earlier run
-- of this file (CREATE TABLE IF NOT EXISTS above does not retroactively
-- change an existing column) -- idempotent either way.
alter table public.orders alter column provider drop default;
alter table public.orders alter column provider drop not null;

alter table public.orders enable row level security;

drop policy if exists "orders: read own" on public.orders;
create policy "orders: read own"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "orders: admin read all" on public.orders;
create policy "orders: admin read all"
  on public.orders for select
  using (public.is_admin());
-- No INSERT / UPDATE / DELETE policy: all writes go through service_role
-- (create-order-checkout's plain insert, or the trusted RPCs below).

-- =====================================================================
-- 2. service_periods
-- =====================================================================
create table if not exists public.service_periods (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id),
  user_id uuid not null references auth.users (id) on delete restrict,
  plan_code text not null,
  service_period_start timestamptz not null,
  service_period_end timestamptz not null,
  status text not null default 'active' check (status in ('active', 'expired')),
  termination_requested_at timestamptz,
  terminated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.service_periods enable row level security;

drop policy if exists "service_periods: read own" on public.service_periods;
create policy "service_periods: read own"
  on public.service_periods for select
  using (auth.uid() = user_id);

drop policy if exists "service_periods: admin read all" on public.service_periods;
create policy "service_periods: admin read all"
  on public.service_periods for select
  using (public.is_admin());
-- No INSERT / UPDATE / DELETE policy: only apply_order_payment() (service_role,
-- SECURITY DEFINER) ever writes here.

-- =====================================================================
-- 3. payment_events.order_id  (additive; Step 6/7 will populate it)
-- =====================================================================
alter table public.payment_events
  add column if not exists order_id uuid references public.orders (id);

-- =====================================================================
-- 4. apply_order_payment(...)
--    Core-owned "payment verified" transition. The guard (status +
--    payment_attempt + payment_expires_at + amount + provider all matching
--    in one WHERE clause) is what a Provider Adapter's webhook handler
--    calls AFTER it has independently verified the charge -- this function
--    never talks to any provider itself.
--
--    p_provider is matched against orders.provider, which is NULL until a
--    Provider Adapter sets it (see orders.provider above) -- so this call
--    can only succeed for an Order a real Adapter has already started a
--    checkout for. Step 5's own tests set provider manually to simulate
--    that, since no Adapter exists yet.
-- =====================================================================
create or replace function public.apply_order_payment(
  p_order_id uuid,
  p_payment_attempt integer,
  p_provider text,
  p_provider_ref text,
  p_payment_method text,
  p_verified_amount integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders;
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

  insert into public.service_periods (
    order_id, user_id, plan_code, service_period_start, service_period_end
  ) values (
    v_order.id, v_order.user_id, v_order.plan_code, now(),
    now() + case v_order.plan_code
      when 'monthly' then interval '1 month'
      when 'annual' then interval '1 year'
    end
  );
end;
$$;

-- =====================================================================
-- 5. mark_payment_failed(...)
-- =====================================================================
create or replace function public.mark_payment_failed(
  p_order_id uuid,
  p_payment_attempt integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set status = 'payment_failed',
      updated_at = now()
  where id = p_order_id
    and status = 'pending_payment'
    and payment_attempt = p_payment_attempt;

  if not found then
    raise exception 'order_not_eligible_for_failure_marking';
  end if;
end;
$$;

-- =====================================================================
-- 6. retry_order_payment(p_order_id)
--    payment_failed -> pending_payment, payment_attempt + 1. Guard is a
--    single atomic UPDATE (status + window in one WHERE), so concurrent
--    retry calls for the same Order cannot both advance the attempt.
-- =====================================================================
create or replace function public.retry_order_payment(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_attempt integer;
begin
  update public.orders
  set status = 'pending_payment',
      payment_attempt = payment_attempt + 1,
      updated_at = now()
  where id = p_order_id
    and status = 'payment_failed'
    and payment_expires_at > now()
  returning payment_attempt into v_new_attempt;

  if not found then
    raise exception 'order_not_eligible_for_retry';
  end if;

  return v_new_attempt;
end;
$$;

-- =====================================================================
-- 7. expire_pending_orders()
--    Sweep function only -- no cron/scheduling wired up in this phase.
--    Callable manually (service_role) or later hooked to pg_cron /
--    a scheduled Edge Function (Step 10 concern).
-- =====================================================================
create or replace function public.expire_pending_orders()
returns integer
language sql
security definer
set search_path = public
as $$
  with expired as (
    update public.orders
    set status = 'payment_expired', updated_at = now()
    where status in ('pending_payment', 'payment_failed')
      and payment_expires_at < now()
    returning 1
  )
  select count(*)::integer from expired;
$$;

-- Least privilege: revoke from PUBLIC/anon/authenticated, grant only to
-- service_role (Core Edge Functions / future Provider Adapter webhook
-- handlers), matching the existing repo-wide pattern.
revoke execute on function public.apply_order_payment(uuid, integer, text, text, text, integer)
  from public, anon, authenticated;
grant execute on function public.apply_order_payment(uuid, integer, text, text, text, integer)
  to service_role;

revoke execute on function public.mark_payment_failed(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.mark_payment_failed(uuid, integer) to service_role;

revoke execute on function public.retry_order_payment(uuid)
  from public, anon, authenticated;
grant execute on function public.retry_order_payment(uuid) to service_role;

revoke execute on function public.expire_pending_orders()
  from public, anon, authenticated;
grant execute on function public.expire_pending_orders() to service_role;
