-- JOTI Payment Rebuild -- Step 4: Contract Review & Acceptance Flow
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema.sql has already
-- been run. Safe to re-run (all statements are idempotent: create ... if
-- not exists / add column if not exists / create or replace / drop policy
-- if exists before create).
--
-- What this file adds:
--   1. contract_versions             -- Registry: authoritative source for
--                                        "current applicable Basic
--                                        Agreement" + per-version metadata
--   2. contract_acceptances          -- ACCEPTANCE SOURCE OF TRUTH
--                                        (append-only, immutable)
--   3. profiles.review_contract_version / review_presented_at
--                                     -- pending Review Session (at most
--                                        one per user, cleared on Agree)
--   4. start_contract_review()       -- idempotent get-or-create for a
--                                        pending Review Session
--   5. agree_to_contract()           -- initial, payment-pre 3-day-gated
--                                        Agree flow
--   6. reaccept_contract()           -- existing-member re-acceptance
--                                        flow (no 3-day wait)
--   7. protect_profile_system_fields() -- CREATE OR REPLACE, extends the
--                                        schema_subscriptions.sql version
--                                        to also guard the two new columns
--
-- Design invariants (Step 4 Final Implementation Plan):
--   - Review Session binding happens exactly once per pending review, at
--     start_contract_review() time -- it is never re-derived from
--     "current" again until Agree clears it.
--   - contract_acceptances is APPEND-ONLY. No UPDATE, no DELETE, ever,
--     under any circumstance (including reacceptance -- that produces a
--     NEW row, the old one is untouched).
--   - No client role (anon / authenticated) may INSERT/UPDATE/DELETE
--     contract_versions or contract_acceptances, or EXECUTE any of the
--     three functions below. Only the Edge Functions' service_role key
--     can (distinct grants, added explicitly below).
--   - reaccept_contract() deliberately does NOT touch
--     profiles.review_contract_version / review_presented_at -- those
--     columns represent the pre-payment 3-day Review Session only, and
--     reacceptance is a legally distinct flow (payment-legal-spec.md
--     §8 explicitly does not require a new 3-day period for it).
--
-- The ORIGINAL definition of protect_profile_system_fields() that step 7
-- replaces is preserved verbatim in
-- supabase/schema_contract_review_ROLLBACK.sql.

-- =====================================================================
-- 1. contract_versions  (Registry / authoritative "current version" source)
-- =====================================================================
create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  effective_at timestamptz not null,
  requires_reacceptance boolean not null,
  content_identifier text not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

-- At most one row may be the current version at any time.
create unique index if not exists contract_versions_is_current_unique
  on public.contract_versions (is_current)
  where is_current;

alter table public.contract_versions enable row level security;

-- Non-sensitive metadata (which version is current, and its own
-- metadata) -- readable by anyone, including signed-out visitors who
-- have not started a Review yet.
drop policy if exists "contract_versions: read all" on public.contract_versions;
create policy "contract_versions: read all"
  on public.contract_versions for select
  using (true);
-- No INSERT / UPDATE / DELETE policy: publishing a new version is a
-- service_role-only operation in this phase (no admin UI yet).

-- =====================================================================
-- 2. contract_acceptances  (ACCEPTANCE SOURCE OF TRUTH -- append-only)
-- =====================================================================
create table if not exists public.contract_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  contract_version text not null,
  contract_presented_at timestamptz not null,
  contract_review_available_at timestamptz not null,
  contract_acceptance_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.contract_acceptances enable row level security;

drop policy if exists "contract_acceptances: read own" on public.contract_acceptances;
create policy "contract_acceptances: read own"
  on public.contract_acceptances for select
  using (auth.uid() = user_id);

drop policy if exists "contract_acceptances: admin read all" on public.contract_acceptances;
create policy "contract_acceptances: admin read all"
  on public.contract_acceptances for select
  using (public.is_admin());
-- No INSERT / UPDATE / DELETE policy: only agree_to_contract() /
-- reaccept_contract() (service_role, SECURITY DEFINER) ever write here.
-- Immutable: never updated, never deleted, by design.

-- =====================================================================
-- 3. profiles.review_contract_version / review_presented_at
--    (pending Review Session -- at most one per user; cleared on Agree)
--    Purely additive: every existing row gets NULL/NULL, so nothing
--    about current members' behaviour changes until they start a Review.
-- =====================================================================
alter table public.profiles
  add column if not exists review_contract_version text,
  add column if not exists review_presented_at timestamptz;

-- =====================================================================
-- 4. start_contract_review(p_user_id)
--    Idempotent get-or-create. Reads "current applicable version" ONLY
--    when the caller has no pending review yet; otherwise returns the
--    already-pinned values untouched, regardless of what is current now.
--    Race-safe: the guarded UPDATE (... WHERE review_contract_version IS
--    NULL) ensures concurrent calls for the same brand-new user converge
--    on the same pinned version (only one UPDATE can match).
-- =====================================================================
create or replace function public.start_contract_review(p_user_id uuid)
returns table (
  contract_version text,
  presented_at timestamptz,
  review_available_at timestamptz,
  content_identifier text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_version text;
begin
  select cv.version into v_current_version
  from public.contract_versions cv
  where cv.is_current
  limit 1;

  if v_current_version is null then
    raise exception 'no_current_contract_version';
  end if;

  update public.profiles
  set review_contract_version = v_current_version,
      review_presented_at = now()
  where id = p_user_id
    and review_contract_version is null;

  return query
    select p.review_contract_version, p.review_presented_at,
           p.review_presented_at + interval '3 days',
           cv.content_identifier
    from public.profiles p
    join public.contract_versions cv on cv.version = p.review_contract_version
    where p.id = p_user_id;
end;
$$;

-- =====================================================================
-- 5. agree_to_contract(p_user_id)
--    Initial, payment-pre Agree flow. Locks the caller's profiles row
--    (SELECT ... FOR UPDATE) and re-validates eligibility before clearing
--    it, all within one transaction -- a concurrent duplicate call blocks
--    on the row lock, then (after the first call commits) re-evaluates
--    the same WHERE clause against the now-cleared row and correctly
--    finds nothing, so it cannot also claim the same Review Session.
--
--    NOTE: this does NOT use `UPDATE ... RETURNING ... INTO` to capture
--    the pending review's values, because RETURNING on an UPDATE yields
--    the post-update (new) row, not the pre-update (old) one -- doing so
--    would capture the NULLs this function itself just wrote. The old
--    values are read first (and locked) via a separate SELECT.
-- =====================================================================
create or replace function public.agree_to_contract(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version text;
  v_presented_at timestamptz;
  v_acceptance_id uuid;
begin
  select p.review_contract_version, p.review_presented_at
  into v_version, v_presented_at
  from public.profiles p
  where p.id = p_user_id
    and p.review_contract_version is not null
    and p.review_presented_at + interval '3 days' <= now()
  for update;

  if not found then
    raise exception 'no_eligible_pending_review';
  end if;

  update public.profiles
  set review_contract_version = null,
      review_presented_at = null
  where id = p_user_id;

  insert into public.contract_acceptances (
    user_id, contract_version, contract_presented_at,
    contract_review_available_at, contract_acceptance_at
  ) values (
    p_user_id, v_version, v_presented_at,
    v_presented_at + interval '3 days', now()
  )
  returning id into v_acceptance_id;

  return v_acceptance_id;
end;
$$;

-- =====================================================================
-- 6. reaccept_contract(p_user_id)
--    Existing-member re-acceptance flow. Deliberately does NOT check or
--    touch profiles.review_contract_version / review_presented_at -- this
--    is a legally distinct flow from the pre-payment 3-day Review
--    (payment-legal-spec.md §8), so it must not share that state.
--    No 3-day wait: contract_presented_at = contract_review_available_at
--    = contract_acceptance_at = now(), which also makes reacceptance rows
--    distinguishable from initial-flow rows (always a 3-day gap) without
--    needing an extra column.
-- =====================================================================
create or replace function public.reaccept_contract(p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version text;
  v_acceptance_id uuid;
begin
  select cv.version into v_version
  from public.contract_versions cv
  where cv.is_current and cv.requires_reacceptance
  limit 1;

  if v_version is null then
    raise exception 'no_reacceptance_required';
  end if;

  if exists (
    select 1 from public.contract_acceptances
    where user_id = p_user_id and contract_version = v_version
  ) then
    raise exception 'already_accepted';
  end if;

  insert into public.contract_acceptances (
    user_id, contract_version, contract_presented_at,
    contract_review_available_at, contract_acceptance_at
  ) values (p_user_id, v_version, now(), now(), now())
  returning id into v_acceptance_id;

  return v_acceptance_id;
end;
$$;

-- Least privilege: revoke from PUBLIC/anon/authenticated (Supabase's
-- ALTER DEFAULT PRIVILEGES grants EXECUTE on new public functions
-- directly to these roles, so revoking only from PUBLIC is not enough),
-- then grant only to service_role (the Edge Functions).
revoke execute on function public.start_contract_review(uuid)
  from public, anon, authenticated;
grant execute on function public.start_contract_review(uuid) to service_role;

revoke execute on function public.agree_to_contract(uuid)
  from public, anon, authenticated;
grant execute on function public.agree_to_contract(uuid) to service_role;

revoke execute on function public.reaccept_contract(uuid)
  from public, anon, authenticated;
grant execute on function public.reaccept_contract(uuid) to service_role;

-- =====================================================================
-- 7. protect_profile_system_fields()  -- CREATE OR REPLACE
--    Extends the schema_module_usage.sql / schema_subscriptions.sql
--    version to ALSO revert any client (authenticated-role, non-trusted)
--    change to review_contract_version / review_presented_at -- these are
--    only ever written by start_contract_review() / agree_to_contract()
--    (service_role), never client-writable.
--    ORIGINAL definition preserved in
--    supabase/schema_contract_review_ROLLBACK.sql.
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

    if new.review_contract_version is distinct from old.review_contract_version then
      new.review_contract_version := old.review_contract_version;
    end if;

    if new.review_presented_at is distinct from old.review_presented_at then
      new.review_presented_at := old.review_presented_at;
    end if;
  end if;

  return new;
end;
$$;
