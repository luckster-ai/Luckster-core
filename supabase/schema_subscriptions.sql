-- JOTI Subscription / Payment -- Oen integration data layer
-- (Payment Phase 1 -- Oen TEST first-subscription MVP).
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema.sql and
-- schema_module_usage.sql have already been run. Safe to re-run (all
-- statements are idempotent: create ... if not exists / add column if not
-- exists / create or replace / drop policy if exists before create).
--
-- What this file adds:
--   1. profiles.subscription_status          -- derived cache / projection
--   2. subscription_checkouts                -- pending checkout intents
--   3. subscriptions                         -- SUBSCRIPTION SOURCE OF TRUTH
--   4. payment_events                        -- append-only audit + webhook idempotency
--   5. derive_subscription_status(user_id)   -- the ONE place the cache is computed
--   6. apply_oen_subscription_charge(...)    -- the ONE trusted writer (service_role only)
--   7. get_membership_status()               -- CREATE OR REPLACE, adds 'subscriber' branch
--   8. protect_profile_system_fields()       -- CREATE OR REPLACE, also guards subscription_status
--
-- Design invariants (Final Plan Review A1-A16):
--   - `subscriptions` rows are the SUBSCRIPTION SOURCE OF TRUTH.
--   - `profiles.subscription_status` is a DERIVED PROJECTION. It is only
--     ever written inside apply_oen_subscription_charge(), in the same
--     transaction as the subscriptions upsert, and its value is always
--     recomputed from `subscriptions` via derive_subscription_status().
--   - Every payment table carries `mode` ('test' | 'live'). This phase
--     only ever writes 'test'.
--   - No client role (anon / authenticated) may INSERT/UPDATE/DELETE any
--     payment table, or EXECUTE apply_oen_subscription_charge() /
--     derive_subscription_status(). Only the Edge Function's service_role
--     key can (it is a distinct grant, added explicitly below).
--
-- The ORIGINAL definitions of get_membership_status() and
-- protect_profile_system_fields() that steps 7 and 8 replace are
-- preserved verbatim in supabase/schema_subscriptions_ROLLBACK.sql.

-- =====================================================================
-- 1. profiles.subscription_status  (derived cache / projection)
--    Purely additive: every existing row gets 'none', so nothing about
--    current members' behaviour changes until a webhook activates one.
-- =====================================================================
alter table public.profiles
  add column if not exists subscription_status text not null default 'none'
  check (subscription_status in ('none', 'active', 'past_due', 'canceled'));

-- =====================================================================
-- 2. subscription_checkouts
--    Our own record mapping an Oen orderId back to a JOTI user. This is
--    the ONLY user-identity source the webhook trusts (A5 -- customId is
--    never used as an identity fallback).
-- =====================================================================
create table if not exists public.subscription_checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_id text not null unique,
  plan_id text not null,
  amount integer not null check (amount > 0),
  mode text not null default 'test' check (mode in ('test', 'live')),
  oen_checkout_id text,
  oen_transaction_hid text,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscription_checkouts enable row level security;

drop policy if exists "subscription_checkouts: read own" on public.subscription_checkouts;
create policy "subscription_checkouts: read own"
  on public.subscription_checkouts for select
  using (auth.uid() = user_id);
-- No INSERT / UPDATE / DELETE policy: only the Edge Function (service_role)
-- ever writes these rows.

-- =====================================================================
-- 3. subscriptions  (SUBSCRIPTION SOURCE OF TRUTH)
-- =====================================================================
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'oen',
  provider_subscription_id text not null,
  plan_id text,
  status text not null
    check (status in ('active', 'past_due', 'canceled', 'expired')),
  amount integer,
  mode text not null default 'test' check (mode in ('test', 'live')),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  started_at timestamptz,
  canceled_at timestamptz,
  latest_transaction_hid text,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subscription_id)
);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions: read own" on public.subscriptions;
create policy "subscriptions: read own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "subscriptions: admin read all" on public.subscriptions;
create policy "subscriptions: admin read all"
  on public.subscriptions for select
  using (public.is_admin());
-- No INSERT / UPDATE / DELETE policy: only the Edge Function (service_role).

-- =====================================================================
-- 4. payment_events  (append-only audit + webhook idempotency anchor)
--    raw_payload can contain PII (card last-4, name, email) -> admin-only
--    read, never echoed to a client.
-- =====================================================================
create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'oen',
  event_key text not null,
  event_type text,
  mode text not null default 'test' check (mode in ('test', 'live')),
  user_id uuid references auth.users (id) on delete set null,
  provider_subscription_id text,
  transaction_hid text,
  raw_payload jsonb not null,
  verification_status text
    check (verification_status in ('verified', 'verification_failed', 'skipped')),
  note text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_key)
);

alter table public.payment_events enable row level security;

drop policy if exists "payment_events: admin read" on public.payment_events;
create policy "payment_events: admin read"
  on public.payment_events for select
  using (public.is_admin());
-- No INSERT / UPDATE / DELETE policy: only the Edge Function (service_role).

-- =====================================================================
-- 5. derive_subscription_status(user_id)
--    The SINGLE place profiles.subscription_status is computed from the
--    source-of-truth rows. MVP only exercises the 'active' branch;
--    'past_due' grace handling is a later phase. Written in full now so
--    the cache can never silently drift from `subscriptions`.
-- =====================================================================
create or replace function public.derive_subscription_status(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1 from public.subscriptions s
      where s.user_id = p_user_id
        and s.status = 'active'
        and (s.current_period_end is null or s.current_period_end > now())
    ) then 'active'
    when exists (
      select 1 from public.subscriptions s
      where s.user_id = p_user_id and s.status = 'past_due'
    ) then 'past_due'
    when exists (
      select 1 from public.subscriptions s
      where s.user_id = p_user_id and s.status in ('canceled', 'expired')
    ) then 'canceled'
    else 'none'
  end;
$$;

-- =====================================================================
-- 6. apply_oen_subscription_charge(...)
--    The ONE trusted writer. Called ONLY by the oen-webhook Edge Function
--    (service_role), AFTER it has:
--      - deduped the event via payment_events,
--      - re-queried and verified the charge against the Oen API,
--      - resolved the user from subscription_checkouts.order_id.
--    Atomic within one transaction:
--      subscriptions upsert  ->  profiles cache (derived)  ->  checkout close.
-- =====================================================================
create or replace function public.apply_oen_subscription_charge(
  p_user_id uuid,
  p_provider_subscription_id text,
  p_plan_id text,
  p_amount integer,
  p_current_period_end timestamptz,
  p_started_at timestamptz,
  p_transaction_hid text,
  p_order_id text,
  p_mode text,
  p_raw jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.subscriptions (
    user_id, provider, provider_subscription_id, plan_id, status, amount,
    mode, current_period_end, started_at, latest_transaction_hid, raw
  ) values (
    p_user_id, 'oen', p_provider_subscription_id, p_plan_id, 'active', p_amount,
    coalesce(p_mode, 'test'), p_current_period_end, p_started_at,
    p_transaction_hid, p_raw
  )
  on conflict (provider, provider_subscription_id) do update set
    status = 'active',
    plan_id = coalesce(excluded.plan_id, public.subscriptions.plan_id),
    amount = coalesce(excluded.amount, public.subscriptions.amount),
    current_period_end = excluded.current_period_end,
    latest_transaction_hid = excluded.latest_transaction_hid,
    raw = excluded.raw,
    updated_at = now();

  update public.profiles
  set subscription_status = public.derive_subscription_status(p_user_id),
      updated_at = now()
  where id = p_user_id;

  update public.subscription_checkouts
  set status = 'completed',
      updated_at = now()
  where order_id = p_order_id;
end;
$$;

-- Least privilege: a logged-in user must NEVER be able to self-activate
-- via supabase.rpc(). Supabase's ALTER DEFAULT PRIVILEGES grants EXECUTE
-- on new public functions directly to the named roles anon / authenticated
-- / service_role, so revoking only from PUBLIC is not enough -- the direct
-- grants to anon and authenticated must be revoked explicitly. Then
-- (re)grant to service_role (the Edge Function). service_role bypasses RLS
-- but does NOT bypass function EXECUTE privileges, so this grant is required.
revoke execute on function public.apply_oen_subscription_charge(
  uuid, text, text, integer, timestamptz, timestamptz, text, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.apply_oen_subscription_charge(
  uuid, text, text, integer, timestamptz, timestamptz, text, text, text, jsonb
) to service_role;

revoke execute on function public.derive_subscription_status(uuid)
  from public, anon, authenticated;
grant execute on function public.derive_subscription_status(uuid) to service_role;

-- =====================================================================
-- 7. get_membership_status()  -- CREATE OR REPLACE
--    Adds a 'subscriber' branch BEFORE the trial branch. Purely additive:
--    every existing profiles row has subscription_status = 'none', so this
--    changes nothing for current users. Mirrors
--    frontend/src/utils/membershipStatus.js exactly.
--    ORIGINAL definition preserved in schema_subscriptions_ROLLBACK.sql.
-- =====================================================================
create or replace function public.get_membership_status(p public.profiles)
returns text
language sql
stable
as $$
  select case
    when p.role = 'admin' then 'admin'
    when p.subscription_status = 'active' then 'subscriber'
    when (now() - p.trial_started_at) < interval '30 days'
      and p.module_usage_seconds < 30 * 60 * 60
      then 'trial'
    else 'trial_expired'
  end;
$$;

-- =====================================================================
-- 8. protect_profile_system_fields()  -- CREATE OR REPLACE
--    Extends the schema_module_usage.sql version to ALSO revert any
--    client (authenticated-role, non-trusted) change to
--    subscription_status -- it is a derived cache, never client-writable.
--    The oen-webhook Edge Function writes via service_role, so
--    auth.role() is NOT 'authenticated' and this guard does not touch its
--    writes. The existing protect_profile_system_fields_trigger (created
--    in schema.sql) stays bound to this function name automatically.
--    ORIGINAL definition preserved in schema_subscriptions_ROLLBACK.sql.
-- =====================================================================
create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() = 'authenticated'
     and coalesce(current_setting('joti.trusted_write', true), '') <> 'true' then
    if new.role is distinct from old.role then
      new.role := old.role;
    end if;

    if new.trial_started_at is distinct from old.trial_started_at then
      new.trial_started_at := old.trial_started_at;
    end if;

    if new.module_usage_seconds is distinct from old.module_usage_seconds then
      new.module_usage_seconds := old.module_usage_seconds;
    end if;

    if new.last_usage_heartbeat_at is distinct from old.last_usage_heartbeat_at then
      new.last_usage_heartbeat_at := old.last_usage_heartbeat_at;
    end if;

    if new.subscription_status is distinct from old.subscription_status then
      new.subscription_status := old.subscription_status;
    end if;
  end if;

  return new;
end;
$$;
