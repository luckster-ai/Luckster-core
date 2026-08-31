-- JOTI Practice Notes — Data Layer (Phase 5C)
--
-- Run this once in the Supabase project's SQL Editor, after schema.sql,
-- schema_learning_progress.sql, schema_module_usage.sql, and
-- schema_practice_activity.sql have already been run. Purely additive --
-- no changes to any of those tables/functions.
--
-- Design notes (Phase 5C architecture discovery, confirmed 2026-08-31):
--   - A Note is a member's own reflection attached to one specific
--     practice_sessions row (Phase 5B) -- Session is the fact ("did this
--     happen"), Note is optional user-generated content about it. Never
--     merge the two: this table has no completed_at/module_ids of its
--     own, and practice_sessions gets no content/visibility columns.
--   - Exactly two visibility values, both confirmed product decisions:
--       - private: only the author (own row, RLS owner check).
--       - public: genuinely public -- ANY reader, including a signed-out
--         visitor, not just other members. This is a deliberate product
--         choice (a member choosing "public" is choosing to let their
--         experience become outward-facing content for people who
--         haven't joined JOTI yet), not a technical default -- see the
--         anon grant below, which is the one thing that actually makes
--         it true.
--   - No coins/points/level/reward column here or ever -- see
--     schema_practice_activity.sql's equivalent note. A future reward
--     ledger references practice_notes.id via source_type/source_id;
--     this table never references the ledger.
--   - No comments/moderation-log table here -- both are confirmed
--     future work. Nothing below needs to change to add either later:
--     a future note_comments table would reference practice_notes.id
--     the same way this table references practice_sessions.id, and a
--     future admin-moderation policy is a single additional
--     `using (public.is_admin())` policy on this table (is_admin()
--     already exists, schema.sql Phase 2A) -- see the commented-out
--     example at the bottom. Muting/restricting a member is similarly
--     additive later (e.g. a future profiles column checked in the
--     insert policy) and needs no schema change now to stay possible.
--   - IMPORTANT for whenever a future UI wants to show an author name on
--     a public Note: never join practice_notes to profiles for a public
--     read. profiles has no public-read policy (Phase 2A) and none
--     should ever be added just for this -- a member's row there
--     includes their email. The safe pattern is a member-chosen public
--     display name, either denormalized onto practice_notes directly at
--     write time, or a separate narrow table/view exposing nothing but
--     (user id, display name) to anon. Not needed yet -- Phase 5C's
--     content column and this comment are the only things a future
--     implementer needs to know to not accidentally leak email.

create table if not exists public.practice_notes (
  id uuid primary key default gen_random_uuid(),
  -- Nullable, on delete set null (not cascade): this is what lets an
  -- account deletion anonymize a public Note (row survives, user_id
  -- goes null, visibility='public' keeps it readable to everyone) while
  -- a private Note effectively disappears from view the same instant
  -- (nobody's auth.uid() can ever equal null, and it was never public
  -- to begin with) -- one FK behavior correctly produces both outcomes,
  -- no trigger, no visibility-conditional deletion logic needed.
  user_id uuid references auth.users (id) on delete set null,
  -- Same on delete set null, for the same reason: practice_sessions rows
  -- fully cascade-delete on account deletion (Phase 5B, unchanged --
  -- sessions are never public, nothing to anonymize there), which would
  -- otherwise transitively delete an anonymized-but-kept public Note if
  -- this FK were cascade too.
  practice_session_id uuid references public.practice_sessions (id) on delete set null,
  content text not null,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.practice_notes enable row level security;

-- practice_notes is the first table in this project where anon reading
-- ANYTHING is an intended outcome, not something RLS happens to block
-- regardless of table-level grants (every earlier table's policies are
-- all auth.uid() = user_id, which is never true for anon, so whether
-- anon had a base SELECT grant never actually mattered before now).
-- Made explicit here rather than relying on an unverified assumption
-- about project-level default privileges.
grant select on public.practice_notes to anon;

drop policy if exists "practice_notes: read own or public" on public.practice_notes;
create policy "practice_notes: read own or public"
  on public.practice_notes for select
  using (auth.uid() = user_id or visibility = 'public');

-- Ownership of the target session is re-checked on both insert AND
-- update below (not just insert) -- otherwise a member could create a
-- Note against their own session, then UPDATE practice_session_id to
-- point at someone else's session afterward, since RLS's `using` clause
-- only re-checks "is this row still mine," not "are the new column
-- values I'm writing legitimate."
drop policy if exists "practice_notes: insert own" on public.practice_notes;
create policy "practice_notes: insert own"
  on public.practice_notes for insert
  with check (
    auth.uid() = user_id
    and practice_session_id is not null
    and exists (
      select 1 from public.practice_sessions ps
      where ps.id = practice_session_id and ps.user_id = auth.uid()
    )
  );

drop policy if exists "practice_notes: update own" on public.practice_notes;
create policy "practice_notes: update own"
  on public.practice_notes for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (
      practice_session_id is null
      or exists (
        select 1 from public.practice_sessions ps
        where ps.id = practice_session_id and ps.user_id = auth.uid()
      )
    )
  );

-- Notes are the member's own content, unlike practice_sessions
-- (deliberately no delete there -- see that file's comment): letting
-- the owner delete their own Note outright doesn't threaten any
-- Activity-log integrity, since practice_sessions remains the actual
-- fact of record for "did this practice happen."
drop policy if exists "practice_notes: delete own" on public.practice_notes;
create policy "practice_notes: delete own"
  on public.practice_notes for delete
  using (auth.uid() = user_id);

-- Future admin moderation (NOT enabled now -- confirmed out of scope for
-- Phase 5C, kept here only as the documented extension point):
--
-- create policy "practice_notes: admin manage all"
--   on public.practice_notes for all
--   using (public.is_admin());
