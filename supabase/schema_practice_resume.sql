-- JOTI Practice Resume / Progress — Data Layer (Phase 5E)
--
-- Run this once in the Supabase project's SQL Editor, after
-- schema_practice_activity.sql. Independent of every other schema file --
-- it only adds columns to practice_sessions and one function.
--
-- Design notes:
--   - Extends practice_sessions (Phase 5B) with just enough to resume a
--     partially-watched Practice: which Module the viewer was on, the
--     playback position within that Module's video, and when that was
--     last touched. Nothing else about that table changes -- practice_id,
--     module_ids, started_at and completed_at keep their exact Phase 5B
--     meaning and their tamper-proofing (no client UPDATE policy on the
--     table at all; completed_at still only settable via
--     complete_practice_session()).
--   - progress_module_index is an index into THIS row's frozen
--     module_ids snapshot (not a live lookup) -- so "resume at Module N"
--     stays meaningful even if the Practice definition later changes. The
--     client compares module_ids against the Practice's current resolved
--     Module id list before trusting the index; a mismatch means "cannot
--     resume, start fresh" (no partial/mapped resume).
--   - progress_updated_at is nullable and starts null. null means "this
--     session never actually produced progress" -- the client treats such
--     a session as not resumable. It is the last-activity timestamp the
--     client's 1h / 12h resume window is measured against; started_at is
--     not used for that (a session can sit unstarted).
--   - Progress may move backward (the viewer stepped back a Module):
--     save_practice_session_progress() stores the CURRENT position, it is
--     not a monotonic high-water mark.
--   - save_practice_session_progress() mirrors complete_practice_session()
--     exactly: SECURITY DEFINER, only ever touches its own caller's
--     not-yet-finished session, and here only the three progress columns.
--     practice_sessions has no trigger, so none of schema_module_usage's
--     'joti.trusted_write' dance is needed.

alter table public.practice_sessions
  add column if not exists progress_module_index integer not null default 0,
  add column if not exists progress_position_seconds real not null default 0,
  add column if not exists progress_updated_at timestamptz;

-- The one trusted path for writing resume progress. p_module_index is
-- range-checked against this row's module_ids (0 <= index < length) and
-- p_position_seconds is floored at 0 -- an out-of-range call updates
-- nothing rather than storing a value the client could never resume from.
create or replace function public.save_practice_session_progress(
  p_session_id uuid,
  p_module_index integer,
  p_position_seconds real
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or p_session_id is null or p_module_index is null then
    return;
  end if;

  update public.practice_sessions
  set progress_module_index    = p_module_index,
      progress_position_seconds = greatest(0, coalesce(p_position_seconds, 0)),
      progress_updated_at      = now()
  where id = p_session_id
    and user_id = v_user_id
    and completed_at is null
    and p_module_index >= 0
    and p_module_index < cardinality(module_ids);
end;
$$;
