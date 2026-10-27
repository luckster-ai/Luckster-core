-- JOTI Custom Practices -- cross-device sync (Website Refinement M8b)
--
-- Run once in the Supabase project's SQL Editor, after schema.sql.
-- Independent of the other schema files.
--
-- Design notes:
--   - Member-built Practices (Practice Builder → Save) were stored only
--     in the browser's localStorage (state/customPracticeStore.js), so
--     they existed on one device only. This table is their server copy
--     for signed-in members; visitors keep using localStorage.
--   - id is the existing slug ("custom-<time>-<random>"). It is already
--     the practice_id written to practice_sessions, so existing practice
--     history resolves to the migrated rows without any data change.
--   - Primary key (user_id, id): ids are generated client-side, so the
--     composite key keeps one member's id from ever colliding with (or
--     blocking) another member's.
--   - Private data: only the owner can read or write it. There is no
--     admin policy (custom Practices are not public content, so the
--     admin moderation principle does not apply) and anon has no
--     privileges at all.
--   - Composition rules are validated by the existing JS rule engine
--     (utils/validatePracticeBuilder.js); the checks here are only basic
--     shape/size guards. cardinality(), not array_length(), so an empty
--     array is rejected (see schema_practices.sql).
--   - Migration from localStorage is done by the client after sign-in:
--     insert with on-conflict-do-nothing, then remove the local copy
--     only after the insert succeeded, so it is safe to repeat.

create table if not exists public.custom_practices (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null constraint custom_practices_id_format check (id ~ '^custom-[a-z0-9-]{1,60}$'),
  title text not null constraint custom_practices_title_length check (char_length(title) between 1 and 100),
  modules text[] not null constraint custom_practices_modules_size check (cardinality(modules) between 1 and 50),
  builder_sections jsonb,
  relaxation_position text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists custom_practices_user_updated_idx
  on public.custom_practices (user_id, updated_at desc);

alter table public.custom_practices enable row level security;

revoke all on public.custom_practices from anon;
revoke all on public.custom_practices from authenticated;
grant select, insert, update, delete on public.custom_practices to authenticated;

drop policy if exists "custom_practices: read own" on public.custom_practices;
create policy "custom_practices: read own"
  on public.custom_practices for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "custom_practices: insert own" on public.custom_practices;
create policy "custom_practices: insert own"
  on public.custom_practices for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "custom_practices: update own" on public.custom_practices;
create policy "custom_practices: update own"
  on public.custom_practices for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "custom_practices: delete own" on public.custom_practices;
create policy "custom_practices: delete own"
  on public.custom_practices for delete
  to authenticated
  using (auth.uid() = user_id);

-- updated_at is kept by the server, not trusted from the client.
create or replace function public.custom_practices_touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists custom_practices_touch_updated_at on public.custom_practices;
create trigger custom_practices_touch_updated_at
  before update on public.custom_practices
  for each row execute function public.custom_practices_touch_updated_at();
