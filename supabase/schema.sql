-- JOTI Membership / Authentication Foundation (Phase 2A)
--
-- Run this once in the Supabase project's SQL Editor after creating the
-- project (Supabase Dashboard -> SQL Editor -> New query -> paste this
-- file -> Run). auth.users is managed by Supabase itself; this file only
-- adds the app-specific profiles table plus the trigger/policies that
-- keep it in sync and secure.
--
-- Design notes:
--   - Admin is enforced here via Row Level Security + trigger, not the
--     frontend -- hiding a button in React is never the real boundary.
--   - trial_started_at + module_usage_seconds are the two inputs to the
--     "30 days OR 30 hours, whichever first" rule. Nothing in this
--     phase actually increments module_usage_seconds yet, or blocks
--     playback for an expired trial -- that's a deliberately separate,
--     later phase (real watch-time tracking is its own hard problem:
--     anti-abuse, pause/seek handling, etc.). get_membership_status()
--     below is where a future gating feature gets its one, trustable
--     answer once it exists.
--   - marketing_consent is a separate column with its own timestamp,
--     deliberately not bundled into account creation -- consent is an
--     explicit, later, revocable action, not implied by signing up.
--   - No payment-provider fields exist here on purpose (no
--     stripe_customer_id or similar) -- keeps this schema
--     provider-agnostic given no payment vendor (Stripe / 綠界 / 藍新 /
--     PayPal) has been decided yet. A future phase can add a generic
--     payment/subscription table that references profiles.id without
--     touching this schema.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  role text not null default 'member' check (role in ('member', 'admin')),
  trial_started_at timestamptz not null default now(),
  module_usage_seconds integer not null default 0 check (module_usage_seconds >= 0),
  marketing_consent boolean not null default false,
  marketing_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in user can read and update their own profile row. Which
-- COLUMNS they're actually allowed to change is narrowed further below
-- by protect_profile_system_fields() -- RLS alone only controls which
-- ROWS, not which fields within an allowed row.
--
-- CREATE POLICY has no IF NOT EXISTS form (unlike CREATE TABLE/FUNCTION
-- above), so every policy in this file is preceded by DROP POLICY IF
-- EXISTS -- confirmed live (2026-08-27) that re-running this script
-- without that guard fails with "policy already exists" on the first
-- CREATE POLICY it reaches.
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- No insert policy exists for regular users on purpose: the
-- handle_new_user trigger below (SECURITY DEFINER) is the only path
-- that ever creates a profiles row, always via signup, always with
-- role defaulting to 'member'. A user cannot INSERT a profiles row
-- directly (e.g. with role='admin') because there is no policy granting
-- them INSERT at all.

-- Whether the CALLING user's own row has role='admin' -- wrapped in a
-- SECURITY DEFINER function (not inlined into the policy below) because
-- a policy on public.profiles that queries public.profiles directly
-- makes Postgres re-evaluate RLS on that inner query too, which re-hits
-- this same policy, infinitely -- confirmed live (2026-08-27): querying
-- the table from its own policy's USING clause makes PostgREST return a
-- 500 for every read, including "read own". A SECURITY DEFINER function
-- runs as its owner (bypassing RLS internally, same as the trigger
-- functions below), breaking the recursion.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Lets an admin's own client read every profile (needed by any future
-- admin-facing member list) -- still only granted by checking the
-- CALLER's own already-stored role, never anything the frontend claims.
drop policy if exists "profiles: admin read all" on public.profiles;
create policy "profiles: admin read all"
  on public.profiles for select
  using (public.is_admin());

-- Auto-create a profile row whenever a new auth.users row appears --
-- signup via email magic link, Google, or any future provider all
-- funnel through auth.users, so this one trigger covers every signup
-- method without provider-specific code.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Blocks a signed-in user from changing role / trial_started_at /
-- module_usage_seconds on their OWN row through the normal client API
-- (PostgREST, using their own JWT) -- otherwise "update own profile"
-- above would let anyone grant themselves admin, or reset their own
-- trial by rewriting these fields directly.
--
-- Scoped to auth.role() = 'authenticated' specifically so it does NOT
-- block: (a) you, running SQL directly in the Supabase SQL Editor
-- (auth.role() is NULL there -- no end-user JWT in that session), or
-- (b) a future trusted server-side process using the service_role key
-- (e.g. a real usage-tracking function). Both of those are legitimate,
-- necessary paths to change these fields; only the end user's own
-- authenticated client call is not.
create or replace function public.protect_profile_system_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.role() = 'authenticated' then
    if new.role is distinct from old.role then
      new.role := old.role;
    end if;

    if new.trial_started_at is distinct from old.trial_started_at then
      new.trial_started_at := old.trial_started_at;
    end if;

    if new.module_usage_seconds is distinct from old.module_usage_seconds then
      new.module_usage_seconds := old.module_usage_seconds;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_system_fields_trigger on public.profiles;
create trigger protect_profile_system_fields_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_system_fields();

-- Derived membership status -- mirrors
-- frontend/src/utils/membershipStatus.js exactly (same 30-day / 30-hour
-- rule). Not called by anything yet; exists so a future gating feature
-- has one server-side-trustable answer to check against, instead of
-- trusting a client-computed value that could be tampered with.
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

-- ---------------------------------------------------------------------
-- One-time manual step (run separately, AFTER you've signed up through
-- the live site once -- the trigger above needs your auth.users row to
-- exist first):
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
--
-- Repeat for any future additional admin.
-- ---------------------------------------------------------------------
