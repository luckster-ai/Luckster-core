-- JOTI Official Practice category (Website Refinement, 2026-10)
--
-- Run once in the Supabase project's SQL Editor, after
-- schema_practices.sql. Rollback: schema_practice_category_ROLLBACK.sql.
--
-- Design notes (confirmed 2026-10-29):
--   - One category per Official Practice, chosen by the Admin in the
--     Practice editor; /practice groups the published Practices by it.
--     The front end does not hard-code which Practice belongs where.
--   - A dedicated column rather than a value inside `tags`: a category is
--     single-valued from a fixed set, which a CHECK constraint can
--     guarantee; `tags` is free-form and multi-valued.
--   - Values: standard (標準昆達里尼瑜伽課), breath_meditation (呼吸與冥想課),
--     short_meditation (短時間冥想課). Labels live in the front end
--     (utils/practiceCategories.js).
--   - Nullable: a row without a category still works; /practice lists it
--     after the three categories. No RLS change -- the existing
--     practices policies and the anon select grant cover the new column.

alter table public.practices
  add column if not exists category text;

alter table public.practices
  drop constraint if exists practices_category_check;

alter table public.practices
  add constraint practices_category_check
  check (category is null or category in ('standard', 'breath_meditation', 'short_meditation'));

-- Existing published Official Practices (categories confirmed by the
-- owner 2026-10-29). Only fills rows that have no category yet, so it is
-- safe to run again and never overwrites an Admin's later choice.
update public.practices set category = 'standard'
  where category is null
    and slug in ('elevation-life-caliber-3', 'morning-sadhana-breath-meditation', 'practice01-surya-kirtan18');

update public.practices set category = 'short_meditation'
  where category is null
    and slug = 'SaTaNaMa-30min-meditation';
