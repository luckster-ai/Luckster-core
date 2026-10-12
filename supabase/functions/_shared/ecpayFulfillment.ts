// ECPay Checkout Session flow: the ONE payment-verification + fulfilment
// path, shared by ecpay-webhook (ECPay's server notification) and
// confirm-checkout-session (the member's return to JOTI, used when the
// notification is late). Both callers must go through this function so
// that the two can never disagree about whether a payment counts.
//
//   1. MANDATORY QueryTradeInfo re-query (authenticated read-back,
//      response CheckMacValue verified) -- entitlement is never granted
//      from a notification body or a browser redirect alone
//   2. TradeStatus must be 1 (paid); TradeNo / amount must match what the
//      caller already knows (the notification, if any) and the session
//   3. fulfill_checkout_session() -- idempotent, race-safe; creates the
//      paid Order + Service Period, or rejects (manual refund)
//
// Returns a classification only; each caller maps it to its own response
// (webhook: 1|OK vs 0|retry; confirm: JSON for the return page).

import { queryTradeInfo } from "./ecpay.ts";
import { ECPAY_PROVIDER_NAME } from "./ecpayAdapter.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

export type CheckoutSessionRow = {
  id: string;
  user_id: string;
  merchant_trade_no: string;
  amount: number;
  status: string;
};

export type FulfilmentResult =
  // Order + Service Period exist for this session (now or earlier)
  | { kind: "fulfilled"; orderId: string; tradeNo: string; alreadyFulfilled: boolean }
  // payment verified but deliberately not fulfilled -> manual refund
  | { kind: "rejected"; reason: string; tradeNo: string }
  // ECPay does not (yet) report this trade as paid
  | { kind: "not_paid"; tradeStatus: string }
  // TradeNo / amount do not match -- never fulfilled, never retried
  | { kind: "mismatch"; note: string; tradeNo: string }
  // transient (QueryTradeInfo or the RPC failed) -- safe to try again
  | { kind: "unavailable"; note: string };

// ECPay PaymentType for a credit card charge is "Credit_CreditCard";
// terminate-service-period's refund guard expects the provider-neutral
// value "card" (the same one the Oen path stores).
export function normalizePaymentMethod(paymentType: string): string {
  return paymentType.startsWith("Credit") ? "card" : paymentType;
}

export async function verifyAndFulfillEcpaySession(
  svc: Svc,
  session: CheckoutSessionRow,
  notified?: { tradeNo: string; amount: number; paymentType: string },
): Promise<FulfilmentResult> {
  const requery = await queryTradeInfo(session.merchant_trade_no).catch((e) => {
    console.error("QueryTradeInfo threw:", (e as Error).message);
    return null;
  });
  if (!requery) return { kind: "unavailable", note: "requery_threw" };
  if (!requery.ok || !requery.data || !requery.macValid) {
    console.error(
      "QueryTradeInfo unavailable:",
      requery.status,
      `macValid=${requery.macValid}`,
      requery.raw.slice(0, 200),
    );
    return { kind: "unavailable", note: "requery_unavailable" };
  }

  const q = requery.data;
  if (q.TradeStatus !== "1") {
    return { kind: "not_paid", tradeStatus: q.TradeStatus ?? "?" };
  }

  const tradeNo = q.TradeNo ?? "";
  const queriedAmount = Number(q.TradeAmt);
  const tradeNoOk = !!tradeNo && (!notified || notified.tradeNo === tradeNo);
  const amountOk = queriedAmount === session.amount &&
    (!notified || notified.amount === session.amount);
  if (!tradeNoOk || !amountOk) {
    return { kind: "mismatch", note: `tradeNoOk=${tradeNoOk} amountOk=${amountOk}`, tradeNo };
  }

  const { data, error } = await svc.rpc("fulfill_checkout_session", {
    p_merchant_trade_no: session.merchant_trade_no,
    p_provider: ECPAY_PROVIDER_NAME,
    p_provider_ref: tradeNo,
    p_payment_method: normalizePaymentMethod(q.PaymentType || notified?.paymentType || ""),
    p_verified_amount: queriedAmount,
  });
  if (error || !data) {
    console.error("fulfill_checkout_session failed:", error?.message);
    return { kind: "unavailable", note: "fulfill_rpc_failed" };
  }

  switch (data.outcome) {
    case "fulfilled":
    case "already_fulfilled":
      return {
        kind: "fulfilled",
        orderId: data.order_id,
        tradeNo,
        alreadyFulfilled: data.outcome === "already_fulfilled",
      };
    case "rejected":
      return { kind: "rejected", reason: data.reason ?? "unknown", tradeNo };
    default:
      // not_found: the caller resolved the session a moment ago, so this
      // can only be a transient inconsistency.
      return { kind: "unavailable", note: `fulfill_outcome_${data.outcome}` };
  }
}
