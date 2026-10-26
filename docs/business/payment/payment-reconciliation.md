# JOTI Payment Reconciliation (Launch phase: daily, manual, read-only)

Decided 2026-10-26: at launch, reconciliation is a **daily manual, read-only check**. QueryTradeInfo automation is not built now, and `refund_failed` / `rejected` cases are handled manually (no automatic retry).

Rule order: `docs/legal/` → `payment-legal-spec.md` → `payment-integration-rules.md` → this file. This file only describes how to **find** discrepancies. Fixing one follows the existing rules and, where no rule exists, the operator's decision. Never edit payment data directly to make the numbers match.

## When and where

- Once a day, for the previous 24 hours (Asia/Taipei), from the day payments open.
- Database: Production Supabase (`qhyfpabyqksuwjzshjtu`) → SQL Editor, or `supabase db query --linked --project-ref qhyfpabyqksuwjzshjtu`. Run each query inside `begin read only; … rollback;`.
- ECPay: merchant back office → transaction and refund lists for the same period.

## 1. Database checks

```sql
begin read only;

-- A. Checkout Sessions in the window, by status
select status, count(*), sum(amount)
from public.checkout_sessions
where created_at >= now() - interval '24 hours'
group by status;

-- B. Sessions still open after expiry (possible paid-but-not-fulfilled)
select id, user_id, merchant_trade_no, amount, expires_at
from public.checkout_sessions
where status = 'open' and expires_at < now();

-- C. Fulfilled sessions without a paid order, and rejected sessions (paid at ECPay but refused by JOTI: refund manually)
select s.id, s.merchant_trade_no, s.status, s.order_id, s.reject_reason, o.status as order_status
from public.checkout_sessions s
left join public.orders o on o.id = s.order_id
where (s.status = 'fulfilled' and (o.id is null or o.status <> 'paid' and o.status not like 'refund%'))
   or (s.status = 'rejected' and s.resolved_at >= now() - interval '7 days');

-- D. Paid orders without a service period, and service periods whose order is not paid / refunded
select o.id, o.status, o.amount, o.provider_ref
from public.orders o
left join public.service_periods p on p.order_id = o.id
where o.status = 'paid' and p.id is null;

select p.id, p.order_id, o.status
from public.service_periods p
left join public.orders o on o.id = p.order_id
where o.id is null or o.status not in ('paid', 'refund_processing', 'refund_failed', 'refunded');

-- E. Payment events that failed verification, were skipped, or carry a note
select provider, event_key, event_type, mode, verification_status, note, received_at
from public.payment_events
where received_at >= now() - interval '24 hours'
  and (verification_status <> 'verified' or verification_status is null or note is not null);

-- F. Refunds needing attention
select id, user_id, status, refund_amount, refund_requested_at, provider_refund_error
from public.orders
where status = 'refund_failed'
   or (status = 'refund_processing' and refund_requested_at < now() - interval '1 hour');

rollback;
```

Expected result: A shows the day's activity; B–F return **no rows**. Any row is a discrepancy.

## 2. ECPay back office

For the same period, compare:

| ECPay | JOTI |
|---|---|
| Successful transactions: count, total, MerchantTradeNo list | `checkout_sessions` `fulfilled` + `rejected` (query A) and their `merchant_trade_no`; `orders.provider_ref` = ECPay TradeNo |
| Refunds (DoAction) | `orders` with `status = 'refunded'` and `refund_processed_at` in the period |

Every ECPay success must map to exactly one session. Every ECPay refund must map to exactly one refunded order.

## 3. When something does not match

1. Record it: date, MerchantTradeNo / TradeNo, member, amount, which check found it.
2. Do not modify the database by hand.
   - A payment made at ECPay with no fulfilled session (B, or an ECPay row with no match): verify it in the ECPay back office first, then decide how to fulfil or refund it.
   - `rejected` sessions and `refund_failed` orders: manual refund through the ECPay back office, recorded against the order (manual handling decided 2026-10-26).
3. Any case not covered by an existing rule is an operator decision.

## Not covered yet

- Automated QueryTradeInfo polling and alerting (deferred).
- Annual-plan refunds after ECPay's 90-day online refund limit: waiting for ECPay's written explanation and the Contract v1.0 finalisation.
