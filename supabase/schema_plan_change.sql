-- Payment Rebuild -- Step 10: Plan Change.
--
-- Run this ONCE in the Supabase SQL Editor, AFTER schema_refund.sql
-- (apply_order_payment()'s optional p_service_period_start parameter,
-- apply_service_period_early_termination(), the service_periods_no_overlap
-- EXCLUDE constraint) has already been run.
--
-- SCOPE (Step 10, this round only):
--   1. orders.scheduled_service_start  -- additive nullable column.
--
-- That is the ONLY schema change this round. No new table, no new RPC --
-- the RPC capability (apply_order_payment()'s 7th parameter) and the
-- underlying termination/refund mechanics were already built and tested
-- in Step 9; this round's job is purely to WIRE that capability up for
-- Plan Change's "After-Expiry" purchases (see
-- create-order-checkout/index.ts's Plan Change eligibility gate and
-- oen-webhook/index.ts's onetime branch, both updated alongside this
-- file).
--
-- Why this lives on `orders`, not computed at webhook time: the decision
-- of WHEN a Plan Change purchase's Service Period should start is a
-- product/eligibility decision made at Order-creation time (does the
-- member currently have a valid period? did they explicitly ask for
-- After-Expiry?) -- information the webhook, firing later and
-- asynchronously once payment is verified, has no way to reconstruct
-- correctly on its own (the member's "current" period may have changed by
-- then). Storing the server-computed value on the Order itself at
-- creation time (the same pattern payment_expires_at already uses) means
-- the webhook only ever reads it back, never recomputes it.
alter table public.orders
  add column if not exists scheduled_service_start timestamptz;

comment on column public.orders.scheduled_service_start is
  'Payment Rebuild -- Step 10. NULL = Service Period starts at payment '
  'verification time (ordinary purchase, including the "new plan" half '
  'of an Immediate Plan Change, which runs through the exact same NULL '
  'path once the old period has already been terminated). Non-NULL = '
  'Plan Change "After-Expiry": the member''s existing Service Period''s '
  'own end time, computed server-side by create-order-checkout at Order '
  'creation, never recomputed later. Passed through unchanged to '
  'apply_order_payment()''s optional p_service_period_start parameter by '
  'oen-webhook''s onetime branch once payment is verified.';
