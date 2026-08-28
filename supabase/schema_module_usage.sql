-- JOTI Trial / Module Usage Tracking — Data Layer (Phase 4B)
--
-- Run this once in the Supabase project's SQL Editor, after schema.sql
-- and schema_learning_progress.sql have already been run. Independent
-- of learning_progress -- no changes to that table are needed.
--
-- Design notes (per the Phase 4A architecture decisions):
--   - "Usage time" only ever means: real wall-clock seconds while the
--     Module video was playing AND the page was in the foreground. That
--     rule is enforced entirely on the CLIENT side (Phase 4D, not yet
--     built) -- there is no incentive for a member to fake being in the
--     foreground, since inflating their own usage only ends their free
--     trial sooner. Nothing here needs to (or can) verify foreground
--     state; it only needs to verify that the seconds a heartbeat
--     claims are plausible given real elapsed server time.
--   - No fixed per-call cap (e.g. "max 30s per heartbeat") and no
--     separate rate-limit-reject rule. Both would either arbitrarily
--     truncate a normal multi-hour session or outright drop a
--     legitimate heartbeat -- the opposite of "when uncertain, favor
--     the member." Instead: credited_seconds = LEAST(what the client
--     claims, what the server can independently verify actually
--     elapsed since the last heartbeat). A client spamming this
--     function gains nothing, because each call is bounded by the real
--     time since the previous one, not by a constant.
--   - The one edge case with no server-verifiable baseline is a user's
--     very first heartbeat ever (last_usage_heartbeat_at is null) --
--     trusted as-is. One-time, low-stakes (every later call has a real
--     baseline to bound against), and simpler than special-casing it
--     further.
--   - module_usage_events is the append-only raw record (one row per
--     credited heartbeat) -- deliberately separate from
--     profiles.module_usage_seconds (the fast aggregate used for trial
--     gating) so a future Joti-coin/growth-level/analytics feature has
--     real per-Module, per-session history to read, without that
--     feature ever needing to touch this table's writer or these rows'
--     meaning. No coin/points/level columns exist here or ever should.
--   - No Module foreign key: Module content lives in
--     frontend/src/data/modules.js, not a database table (same
--     reasoning as learning_progress.asset_id).

alter table public.profiles
  add column if not exists last_usage_heartbeat_at timestamptz;

create table if not exists public.module_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id text not null,
  seconds integer not null check (seconds > 0),
  recorded_at timestamptz not null default now()
);

alter table public.module_usage_events enable row level security;

-- Read-only for the member who owns the rows (e.g. a future "my
-- activity" view). No insert/update/delete policy exists for regular
-- users -- record_module_usage() below (SECURITY DEFINER) is the only
-- path that ever writes a row, same pattern as profiles' own
-- handle_new_user trigger.
drop policy if exists "module_usage_events: read own" on public.module_usage_events;
create policy "module_usage_events: read own"
  on public.module_usage_events for select
  using (auth.uid() = user_id);

-- Extends Phase 2A's protect_profile_system_fields() to also guard the
-- new last_usage_heartbeat_at column -- CREATE OR REPLACE on the same
-- function name schema.sql already defined; the existing trigger stays
-- bound to it automatically, nothing else needs to change. Without
-- this, a member could PATCH their own last_usage_heartbeat_at directly
-- (e.g. set it hours into the past) and the next record_module_usage()
-- call would trust that fabricated baseline, defeating the whole
-- server-verified-gap design below.
--
-- 'joti.trusted_write' bypass -- found via live testing (2026-08-28):
-- auth.role() reflects the CALLING SESSION's role for the whole
-- transaction, regardless of which function is executing -- a
-- SECURITY DEFINER function's elevated table privileges do NOT change
-- what auth.role() reports inside a trigger it fires. Without this
-- bypass, record_module_usage()'s own legitimate internal UPDATE was
-- being silently reverted by this exact trigger (auth.role() still
-- read 'authenticated', since that's the real member's session,
-- indistinguishable from a direct client PATCH by role alone) --
-- confirmed live: the function computed and returned the correct
-- credited value, but module_usage_seconds/last_usage_heartbeat_at
-- never actually changed. record_module_usage() sets this session-local
-- (is_local = true, so it can never leak into a later, unrelated
-- transaction) flag immediately before its own UPDATE; nothing else can
-- set it, since a client can only ever call the RPC function, never an
-- arbitrary set_config().
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

-- The one trusted entry point for crediting Module usage time. Called
-- by the client (Phase 4D, not built yet) roughly once per heartbeat
-- while the Phase 4A foreground+playing rule holds true; p_elapsed_seconds
-- is however many seconds the client's own local timer measured since
-- its last call. Returns the seconds actually credited (0 if none) --
-- useful for testing now, and for Phase 4D's UI later.
--
-- v_now uses clock_timestamp(), not now()/transaction_timestamp() --
-- found via live testing (2026-08-28): now() is fixed for the whole
-- duration of a transaction, so multiple calls to this function within
-- one transaction (as happens when testing several heartbeats back to
-- back in one SQL Editor run) all see the same "current" time and the
-- gap-based cap always evaluates to ~0, regardless of real elapsed
-- time. In production each heartbeat is its own separate request/
-- transaction, so now() would likely have been fine in practice -- but
-- clock_timestamp() (always the true current wall-clock time,
-- independent of transaction boundaries) is the correct choice for an
-- elapsed-time measurement either way, not something that should rely
-- on an unstated assumption about transaction boundaries.
create or replace function public.record_module_usage(p_module_id text, p_elapsed_seconds integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := clock_timestamp();
  v_last timestamptz;
  v_server_gap integer;
  v_credited integer;
begin
  if v_user_id is null or p_module_id is null or p_elapsed_seconds is null or p_elapsed_seconds <= 0 then
    return 0;
  end if;

  -- Row lock: two heartbeats for the same user arriving concurrently
  -- (e.g. two tabs) must not both read the same stale
  -- last_usage_heartbeat_at and both credit against the same gap.
  select last_usage_heartbeat_at into v_last
  from public.profiles
  where id = v_user_id
  for update;

  if v_last is null then
    v_credited := p_elapsed_seconds;
  else
    v_server_gap := greatest(0, floor(extract(epoch from (v_now - v_last)))::integer);
    v_credited := least(p_elapsed_seconds, v_server_gap);
  end if;

  if v_credited > 0 then
    insert into public.module_usage_events (user_id, module_id, seconds, recorded_at)
    values (v_user_id, p_module_id, v_credited, v_now);
  end if;

  -- See protect_profile_system_fields()'s comment above -- marks this
  -- one UPDATE as trusted so that trigger doesn't revert it. Transaction-
  -- local (is_local = true); gone the instant this call's transaction
  -- ends either way.
  perform set_config('joti.trusted_write', 'true', true);

  update public.profiles
  set module_usage_seconds = module_usage_seconds + v_credited,
      last_usage_heartbeat_at = v_now
  where id = v_user_id;

  return v_credited;
end;
$$;
