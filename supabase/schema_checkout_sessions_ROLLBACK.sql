-- ROLLBACK for supabase/schema_checkout_sessions.sql
--
-- Run this in the Supabase SQL Editor to fully undo
-- schema_checkout_sessions.sql.
--
-- WARNING: dropping public.checkout_sessions destroys the record of which
-- sessions were rejected (paid but not fulfilled -> manual refund). Export
-- any status = 'rejected' rows first. Orders / Service Periods already
-- created by fulfill_checkout_session() are NOT removed.

drop function if exists public.fulfill_checkout_session(text, text, text, text, integer);
drop function if exists public.create_checkout_session(uuid, uuid, text, text, text, integer, text, uuid, text);

drop table if exists public.checkout_sessions;
