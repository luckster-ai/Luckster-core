-- JOTI Practice Activity — Data Layer (Phase 5B)
--
-- Run this once in the Supabase project's SQL Editor, after schema.sql,
-- schema_learning_progress.sql, and schema_module_usage.sql have already
-- been run. Independent of all three -- no changes to any of them.
--
-- Design notes (Phase 5A architecture discovery, confirmed 2026-08-29):
--   - One row per practice ATTEMPT, not a granular event stream and not
--     a timer -- "did this member do this Practice, when, did they
--     finish" is the whole job of this table. Actual watch-time already
--     has a home (Phase 4B's module_usage_events, unrelated and NOT
--     linked here -- see the Phase 5A discovery for why forcing that
--     relationship now would be premature). Calendar/History is a pure
--     derivation of these rows grouped by day, not a separate table.
--   - module_ids is a SNAPSHOT of the Practice's resolved Module id list
--     at the moment this session started, not a live reference back to
--     data/practices.js or a Custom Practice's current localStorage
--     definition. Both are mutable over time (Custom Practices
--     especially -- the Builder's Save flow overwrites by slug in
--     place); without this snapshot, editing a Practice after
--     practicing it would silently rewrite what History shows for every
--     past session against that practice_id. This is the minimal fix --
--     no Practice versioning table, no Custom Practice cloud sync -- and
--     doesn't block adding either later: a future version/sync system
--     can sit alongside this snapshot without this table needing to
--     change.
--   - practice_id has no foreign key, same reasoning as
--     module_usage_events' module_id: Practice content (Official, in
--     data/practices.js, and Custom, in the learner's own localStorage)
--     lives outside the database entirely.
--   - No visibility/sharing concept on this table -- sessions are always
--     private, personal activity, never shown to anyone but their owner.
--     Practice Notes (Phase 5C, not built yet) are a deliberately
--     separate table precisely so this one can stay this simple; the
--     private/members/public visibility + anonymize-on-account-deletion
--     policy confirmed for Phase 5C only applies there.
--   - completed_at is only ever set by complete_practice_session() below.
--     There is deliberately no update policy granting the authenticated
--     role direct write access to this table at all (not even to their
--     own rows) -- so a member cannot fabricate or backdate when a
--     session finished, or edit practice_id/module_ids/started_at after
--     the fact. No trusted_write bypass flag needed here (unlike
--     schema_module_usage.sql's trigger dance) -- there is no trigger on
--     this table for a SECURITY DEFINER function to fight with; simply
--     not granting a client-facing update policy is sufficient.

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  practice_id text not null,
  module_ids text[] not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.practice_sessions enable row level security;

drop policy if exists "practice_sessions: read own" on public.practice_sessions;
create policy "practice_sessions: read own"
  on public.practice_sessions for select
  using (auth.uid() = user_id);

-- Insert-only from the client's own session -- started_at is never part
-- of the client's insert payload (server-side default), and
-- completed_at isn't either (stays null until complete_practice_session()
-- sets it), so there is nothing here for a member to fabricate at
-- creation time either.
drop policy if exists "practice_sessions: insert own" on public.practice_sessions;
create policy "practice_sessions: insert own"
  on public.practice_sessions for insert
  with check (auth.uid() = user_id);

-- Deliberately no update/delete policy for the authenticated role -- see
-- the design note above.

create or replace function public.complete_practice_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.practice_sessions
  set completed_at = now()
  where id = p_session_id
    and user_id = auth.uid()
    and completed_at is null;
end;
$$;
