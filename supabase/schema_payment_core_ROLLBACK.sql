-- ROLLBACK for supabase/schema_payment_core.sql
--
-- Run this in the Supabase SQL Editor to fully undo schema_payment_core.sql.
--
-- WARNING: dropping public.orders / public.service_periods destroys the
-- Order / Service Period source of truth. Only run if the feature is being
-- abandoned.

drop function if exists public.expire_pending_orders();
drop function if exists public.retry_order_payment(uuid);
drop function if exists public.mark_payment_failed(uuid, integer);
drop function if exists public.apply_order_payment(uuid, integer, text, text, text, integer);

alter table public.payment_events drop column if exists order_id;

drop table if exists public.service_periods;
drop table if exists public.orders;
