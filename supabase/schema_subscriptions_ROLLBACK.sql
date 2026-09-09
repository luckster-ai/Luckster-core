-- ROLLBACK for supabase/schema_subscriptions.sql
--
-- Run this in the Supabase SQL Editor to fully undo schema_subscriptions.sql.
-- It:
--   a) restores get_membership_status() and protect_profile_system_fields()
--      to their pre-Payment-Phase-1 definitions (verbatim copies -- see
--      "SOURCE" notes), and
--   b) drops the new functions, tables and column.
--
-- Order matters: restore the two replaced functions first (so nothing
-- depends on the new column), then drop.
--
-- WARNING: dropping public.subscriptions destroys the subscription source
-- of truth. Only run a full rollback if the feature is being abandoned.
-- If you only need to revert the two live functions, run just section A.

-- =====================================================================
-- A. Restore the two CREATE OR REPLACE'd functions to their originals
-- =====================================================================

-- SOURCE: supabase/schema.sql lines 169-181 (verbatim)
create or replace function public.get_membership_status(p public.profiles)
returns text
language sql
stable
as $$
  select case
    when p.role = 'admin' then 'admin'
    when (now() - p.trial_started_at) < interval '30 days'
      and p.module_usage_seconds < 30 * 60 * 60
      then 'trial'
    else 'trial_expired'
  end;
$$;

-- SOURCE: supabase/schema_module_usage.sql lines 89-116 (verbatim -- this
-- was the live definition before Payment Phase 1, itself a CREATE OR
-- REPLACE of the original in schema.sql)
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
  end if;

  return new;
end;
$$;

-- =====================================================================
-- B. Drop the new functions, tables and column
-- =====================================================================
drop function if exists public.apply_oen_subscription_charge(
  uuid, text, text, integer, timestamptz, timestamptz, text, text, text, jsonb
);
drop function if exists public.derive_subscription_status(uuid);

drop table if exists public.payment_events;
drop table if exists public.subscriptions;
drop table if exists public.subscription_checkouts;

alter table public.profiles drop column if exists subscription_status;
