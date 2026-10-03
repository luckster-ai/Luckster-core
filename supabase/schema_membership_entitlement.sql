-- Payment Rebuild -- Step 8: Membership / Entitlement.
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema_payment_core.sql
-- (orders / service_periods) has already been run.
--
-- SCOPE (Step 8 only):
--   1. get_membership_status()  -- CREATE OR REPLACE, adds a Service
--      Period-aware branch to the existing 'subscriber' determination.
--
-- This is the ONLY statement in this file. No new tables, columns, RLS
-- policies, or RPCs -- Step 8 is purely a read-side extension of an
-- already-existing function.
--
-- PREVIOUS definition (what this replaces) lives in
-- schema_subscriptions.sql, "7. get_membership_status()" -- that file is
-- NOT edited; this is a later, additive CREATE OR REPLACE layered on top,
-- same pattern schema_subscriptions.sql itself used against schema.sql's
-- original version. Rolling back Step 8 means re-running that earlier
-- definition.
--
-- Design:
--   - 'subscriber' is now reached by EITHER of two independent, unrelated
--     sources: the Legacy subscription_status='active' cache (written only
--     by apply_oen_subscription_charge()), OR the existence of a currently
--     valid Service Period (written only by apply_order_payment(), Step
--     5/7). This is a plain OR -- no priority ordering between the two,
--     because nothing in the product rules requires one to take precedence
--     over the other; a profile could in principle satisfy both at once
--     (e.g. leftover Legacy TEST subscription data) and either is
--     sufficient on its own.
--   - The Service Period check is a double-bound EXISTS, not a check
--     against the latest row: "has the user EVER purchased" is not the
--     question -- "is there, right now, at least one row whose window
--     covers the current instant" is. This also correctly excludes a
--     future-start Service Period (Plan Change "到期後開始", not yet
--     implemented) from granting access before its own service_period_start
--     arrives, without needing a third status value or a background job --
--     the query is evaluated fresh on every call.
--   - terminated_at IS NULL excludes any Service Period whose access was
--     ended early (Step 9 concern); such a row is never counted even if
--     service_period_end has not yet been reached.
--   - status (the 'active'/'expired' column on service_periods) is
--     deliberately NOT part of this condition -- nothing currently flips
--     it when a period's end time passes, so trusting it here would be
--     wrong. The time-window comparison is the only trustworthy signal.
create or replace function public.get_membership_status(p public.profiles)
returns text
language sql
stable
as $$
  select case
    when p.role = 'admin' then 'admin'
    when p.subscription_status = 'active' then 'subscriber'
    when exists (
      select 1
      from public.service_periods sp
      where sp.user_id = p.id
        and sp.terminated_at is null
        and now() >= sp.service_period_start
        and now() < sp.service_period_end
    ) then 'subscriber'
    when (now() - p.trial_started_at) < interval '30 days'
      and p.module_usage_seconds < 30 * 60 * 60
      then 'trial'
    else 'trial_expired'
  end;
$$;
