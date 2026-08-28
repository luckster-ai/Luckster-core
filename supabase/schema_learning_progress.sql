-- JOTI Learning Data (Phase 3)
--
-- Run this once in the Supabase project's SQL Editor (same project
-- schema.sql was run against). Independent of profiles/schema.sql --
-- no changes to that file or its tables are needed for this one.
--
-- Design notes:
--   - This table holds CURRENT COMPLETION STATUS only: "has this member
--     completed this Lesson/Module, yes/no". One row per (user, asset),
--     upserted in place -- never more than one meaningful row per pair.
--     It is deliberately NOT an activity/event log and NOT a points
--     source. Practice completions, notes, comments, Module usage time,
--     and any future Joti-coin/growth-level bookkeeping belong in their
--     own separate tables later (append-only event logs), which may
--     eventually READ this table as one input among several, but must
--     never be merged into it or bolted on as extra columns here.
--   - asset_type distinguishes 'lesson' (includes a single-lesson
--     Foundation's own lesson, which shares that Foundation's ID) and
--     'module' -- these are the only two asset types that ever appear
--     as a prerequisite of something in frontend/src/utils/
--     prerequisiteEngine.js. Practice is deliberately excluded: nothing
--     is ever "a prerequisite of completing a Practice" today, so a
--     Practice-completion concept isn't needed to make Prerequisites
--     work, and its right shape (append-only session log, not a
--     single-row status) belongs to a future Practice History/Calendar
--     phase instead.
--   - Foundation-level completion is intentionally NOT stored here --
--     always derive "is this Foundation done" from whether every one of
--     its Lessons has a 'completed'/'already_learned' row, the same
--     "compute, don't store" principle already used elsewhere (e.g.
--     Bunny-readiness, Official Practice published status).
--   - asset_id has no foreign key (Foundation/Lesson/Module content
--     lives in static frontend/src/data/*.js files, not a database
--     table), so a renamed/removed id could leave an orphaned row --
--     low-risk, not handled here; a future integrity-check script
--     (same pattern as validate-official-practices.mjs) could catch
--     this later if it ever becomes worth building.

create table if not exists public.learning_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  asset_type text not null check (asset_type in ('lesson', 'module')),
  asset_id text not null,
  status text not null default 'completed' check (status in ('completed', 'already_learned')),
  completed_at timestamptz not null default now(),
  unique (user_id, asset_type, asset_id)
);

alter table public.learning_progress enable row level security;

-- A member can only ever see/write their own rows -- no admin-read-all
-- policy exists yet (nothing in the app needs to view another member's
-- learning data today); add one later the same way profiles' was added,
-- if/when an admin-facing view actually needs it.
drop policy if exists "learning_progress: read own" on public.learning_progress;
create policy "learning_progress: read own"
  on public.learning_progress for select
  using (auth.uid() = user_id);

drop policy if exists "learning_progress: insert own" on public.learning_progress;
create policy "learning_progress: insert own"
  on public.learning_progress for insert
  with check (auth.uid() = user_id);

drop policy if exists "learning_progress: update own" on public.learning_progress;
create policy "learning_progress: update own"
  on public.learning_progress for update
  using (auth.uid() = user_id);

drop policy if exists "learning_progress: delete own" on public.learning_progress;
create policy "learning_progress: delete own"
  on public.learning_progress for delete
  using (auth.uid() = user_id);
