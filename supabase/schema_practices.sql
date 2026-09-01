-- JOTI Official Practice — Supabase Foundation (Phase 6A)
--
-- Run this once in the Supabase project's SQL Editor, after schema.sql
-- has already been run (this file depends only on public.is_admin(),
-- defined there). Independent of schema_learning_progress.sql,
-- schema_module_usage.sql, schema_practice_activity.sql, and
-- schema_practice_notes.sql -- no changes to any of them.
--
-- Design notes (Phase 6A architecture discovery, confirmed 2026-09-01):
--   - This table holds ONLY newly-authored Official Practices going
--     forward. P001 (frontend/src/data/practices.js) is NOT migrated
--     here -- it stays exactly where it is. A Practice's real source of
--     truth is decided by where it lives, not by which table exists;
--     this phase does not change what data/practices.js means or how
--     it's read.
--   - `modules` is a Module ID array (e.g. 'MT001'), not a slug array --
--     a deliberate, confirmed departure from data/practices.js's
--     existing slug-based `modules` field for P001. Existing slug-based
--     Practice data (P001, and every Custom Practice in a learner's own
--     localStorage) is untouched and stays exactly as it is; nothing
--     here requires migrating it. See
--     docs/development/adr/0003-learning-asset-identity-and-prerequisite-validation.md
--     for why ID is the canonical identity and slug is routing-only.
--   - No foreign key from here to practice_sessions.practice_id (or vice
--     versa), on purpose, matching schema_practice_activity.sql's own
--     existing design note: Practice content has always lived outside
--     the database (previously only in data/practices.js and
--     localStorage; now sometimes here too), and practice_sessions was
--     deliberately built to snapshot module_ids rather than depend on
--     any Practice definition still existing or being reachable. Adding
--     an FK now would be a change to that table's contract -- out of
--     scope for this phase, and not needed for this table to work.
--   - `status` has three values -- draft / published / archived.
--     `archived` means "no longer offered," not "deleted": there is
--     deliberately no delete policy below (not even for admin) via the
--     normal client, so a Practice can never be hard-removed through
--     the app once it exists, only moved out of `published`. This
--     matches practice_sessions' own precedent of protecting a
--     lifecycle guarantee by simply not exposing the unwanted operation,
--     rather than trying to prevent it with more RLS logic. A genuine
--     hard-delete, if ever truly needed, is a manual SQL Editor action
--     (same precedent as schema.sql's own admin-promotion step) -- not
--     something this schema needs to provide a policy for.
--     Defaults to 'draft' (not 'published') for any newly-inserted row
--     -- a deliberately safer default than data/practices.js's own
--     "absent status means published" convention, which only exists
--     there for P001's backward compatibility, not as a statement about
--     what a brand new Practice should default to.
--   - No `duration` column. The existing runtime already computes this
--     live from a Practice's resolved Modules
--     (utils/calculatePracticeDuration.js) -- P001's own stored
--     `duration: 0` in data/practices.js is unused dead weight, not a
--     working example to copy. Storing a second, independently-writable
--     copy here would recreate exactly the kind of drift this project
--     just spent a separate phase fixing for Module video references
--     (see docs/course-system/content-schema.md's Primary Video /
--     Previous Source notes) -- for a value with a clear canonical
--     computation and no current caller needing a pre-computed one.
--   - No `builder_sections` / `relaxation_position` columns yet. Both
--     are real, already-used, non-speculative parts of the Practice
--     shape (see data/practices.js's own header comment and
--     validatePracticeBuilder.js) -- they are deferred, not rejected.
--     Phase 6A does not yet know what shape the future Admin CRUD save
--     flow (Phase 6B/6C, not built yet) will actually write, and adding
--     these now would be guessing ahead of that decision. Both are
--     purely additive nullable columns whenever that phase needs them --
--     no migration of any row created under this schema, since none
--     exist yet.
--   - No `difficulty` value-set CHECK constraint. Existing Module data
--     already contains an inconsistent value ('Intermidiate', a typo,
--     in data/modules.js's MA004) -- a strict enum here would enforce a
--     stricter standard than the rest of the project currently holds
--     itself to. Vocabulary/content correctness is an application-layer
--     concern (matches the "database only owns basic data integrity"
--     scope for this phase); the column is just `not null`.
--   - No `created_by` / `updated_by` columns -- single-admin authorship
--     tracking has no current caller and is exactly the kind of
--     "future collaboration" feature this phase was told not to build
--     ahead of.
--   - Column names are snake_case (chinese_title, not chineseTitle),
--     matching every other table in this schema (profiles,
--     practice_sessions, practice_notes). The future Admin store layer
--     (Phase 6B, not built yet) is responsible for mapping this to the
--     frontend's existing camelCase Practice shape, the same way every
--     other Supabase-backed store in this project already maps its own
--     table's snake_case columns to the camelCase the rest of the app
--     expects.

create table if not exists public.practices (
  id text primary key,
  slug text not null unique,
  title text not null,
  chinese_title text not null,
  description text,
  difficulty text not null,
  -- Module ID array, playback-ordered. Basic non-empty check only --
  -- Section composition rules (Tuning In required, exactly one Asana,
  -- Relaxation must follow Asana, etc.) are validated by the existing
  -- JS rule engine (utils/validatePracticeBuilder.js /
  -- utils/validateOfficialPractice.js), not re-implemented here.
  --
  -- cardinality(), not array_length(modules, 1) -- confirmed live
  -- (Phase 6B, 2026-09-01) that array_length() of an empty array
  -- returns NULL, not 0, and a CHECK constraint treats a NULL result as
  -- passing (not failing) -- so array_length(modules, 1) > 0 silently
  -- allowed an empty array through. cardinality() returns 0 for an
  -- empty array, so the same check with it actually rejects one.
  modules text[] not null constraint practices_modules_not_empty check (cardinality(modules) > 0),
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.practices enable row level security;

-- First grant to anon on this table -- Practice Hub / Practice detail
-- pages are public, signed-out-visitor-readable routes (no auth guard
-- in AppRouter.jsx), same reasoning as practice_notes' own anon grant.
grant select on public.practices to anon;

drop policy if exists "practices: read published" on public.practices;
create policy "practices: read published"
  on public.practices for select
  using (status = 'published');

-- Admin sees draft/archived too (needed to manage them at all). Postgres
-- combines multiple permissive SELECT policies with OR, so the
-- effective read rule is: status = 'published' OR is_admin() -- exactly
-- "everyone sees published; only admin sees everything."
drop policy if exists "practices: admin read all" on public.practices;
create policy "practices: admin read all"
  on public.practices for select
  using (public.is_admin());

drop policy if exists "practices: admin insert" on public.practices;
create policy "practices: admin insert"
  on public.practices for insert
  with check (public.is_admin());

drop policy if exists "practices: admin update" on public.practices;
create policy "practices: admin update"
  on public.practices for update
  using (public.is_admin())
  with check (public.is_admin());

-- Deliberately no delete policy for anyone, including admin, via the
-- normal client -- see the `status` design note above.
