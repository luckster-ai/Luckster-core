-- ROLLBACK for supabase/schema_contract_review.sql
--
-- Run this in the Supabase SQL Editor to fully undo schema_contract_review.sql.
-- It:
--   a) restores protect_profile_system_fields() to its pre-Step-4
--      definition (verbatim copy -- see "SOURCE" note), and
--   b) drops the new functions, tables and columns.
--
-- Order matters: restore the replaced function first (so nothing depends
-- on the new columns), then drop.
--
-- WARNING: dropping public.contract_acceptances destroys the acceptance
-- source of truth. Only run a full rollback if the feature is being
-- abandoned. If you only need to revert the live function, run just
-- section A.

-- =====================================================================
-- A. Restore the CREATE OR REPLACE'd function to its original
-- =====================================================================

-- SOURCE: supabase/schema_subscriptions.sql (live definition immediately
-- before Step 4, confirmed verbatim against the linked project on
-- 2026-09-20)
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

-- =====================================================================
-- B. Drop the new functions, tables and columns
-- =====================================================================
drop function if exists public.reaccept_contract(uuid);
drop function if exists public.agree_to_contract(uuid);
drop function if exists public.start_contract_review(uuid);

drop table if exists public.contract_acceptances;
drop table if exists public.contract_versions;

alter table public.profiles
  drop column if exists review_contract_version,
  drop column if exists review_presented_at;
