-- Rollback for schema_practice_category.sql: removes the Official
-- Practice category column (and its check constraint). The stored
-- categories are lost; nothing else in public.practices changes.

alter table public.practices
  drop constraint if exists practices_category_check;

alter table public.practices
  drop column if exists category;
