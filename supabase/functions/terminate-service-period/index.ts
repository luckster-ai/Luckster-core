// Payment Rebuild -- Step 9: Refund / Cancellation / Edge Cases.
//
// Member-initiated early termination of their own currently-active Service
// Period (payment-legal-spec.md §11 / contract 第十一條). NOT the
// violation-based termination path (第二十條 -- different legal basis, no
// refund, out of scope this round).
//
// Provider-independent entry point, same naming pattern as
// create-order-checkout / retry-order-payment: it imports exactly one
// Adapter-specific piece (oenAdapter's refundOenOrder, plus oen.ts's
// getTransaction for the network-ambiguity re-query) -- those two imports
// are the only place this file knows "Oen" exists. Swapping or adding a
// second Provider later means branching on orders.provider here, not
// rewriting the Core-side flow below.
//
// Flow:
//   1. Core RPC apply_service_period_early_termination() -- atomic,
//      re-validates the Service Period is still currently valid, computes
//      the refund amount (fixed here, never recalculated later), and
//      moves the Order to refund_processing. This step never talks to Oen.
//   2. Only after that transaction has committed: call the Provider's
//      refund API using orders.provider_ref (already captured by Step 7,
//      nothing new to look up).
//   3. Finalize via mark_refund_processed() / mark_refund_failed() based
//      on the Provider's response -- or, if the HTTP call itself was
//      ambiguous (timeout / connection drop), re-query via the existing
//      getTransaction() before finalizing, rather than guessing.
//
// refund_failed is a resting terminal state this round -- no retry
// workflow is implemented here, per explicit instruction.
//
// ECPay integration: Orders with provider='ecpay' branch to
// refundViaEcpay() below; the Oen path further down is unchanged.

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";
import { getTransaction } from "../_shared/oen.ts";
import { OEN_PROVIDER_NAME, refundOenOrder } from "../_shared/oenAdapter.ts";
import { ECPAY_PROVIDER_NAME, refundEcpayOrder } from "../_shared/ecpayAdapter.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ECPay integration: steps 2-3 of the flow above for an ECPay Order.
// Same finalization RPCs as the Oen path. One deliberate difference: when
// the refund HTTP call itself is ambiguous (timeout / network error) there
// is no ECPay re-query to fall back on -- CreditDetail/QueryTrade/V2 is
// production-only and needs card-authorization values this flow never
// captures -- so the Order rests in refund_failed with a
// "network_uncertain" note for manual reconciliation in ECPay's merchant
// backend (same resting state the Oen path reaches when its re-query
// cannot confirm a refund).
//
// NOT VERIFIED IN PRODUCTION: ECPay's stage environment does not support
// CreditDetail/DoAction, so an actual ECPay refund has never succeeded
// through this path yet.
async function refundViaEcpay(
  svc: Svc,
  order: {
    id: string;
    provider_checkout_ref: string | null;
    provider_ref: string | null;
    payment_method: string | null;
    refund_amount: number;
  },
): Promise<Response> {
  if (order.payment_method && order.payment_method !== "card") {
    // Only credit card is ever offered (ChoosePayment=Credit) and
    // DoAction is card-only -- checked rather than assumed, same as Oen.
    return json({
      orderId: order.id,
      status: "refund_processing",
      note: "manual_refund_required_non_card_payment_method",
    });
  }
  if (!order.provider_ref || !order.provider_checkout_ref) {
    console.error("ecpay order missing TradeNo/MerchantTradeNo, cannot refund:", order.id);
    return json({ orderId: order.id, status: "refund_processing", note: "missing_provider_ref" });
  }

  let result;
  try {
    result = await refundEcpayOrder({
      merchantTradeNo: order.provider_checkout_ref,
      tradeNo: order.provider_ref,
      amount: order.refund_amount,
    });
  } catch (e) {
    console.error("refundEcpayOrder threw:", (e as Error).message);
    const { error: failErr } = await svc.rpc("mark_refund_failed", {
      p_order_id: order.id,
      p_provider_refund_error:
        `network_uncertain: ${(e as Error).message} -- verify in ECPay merchant backend`,
    });
    if (failErr) {
      console.error("mark_refund_failed failed after ECPay network ambiguity:", failErr.message);
      return json({ error: "refund_uncertain_and_mark_failed" }, 500);
    }
    return json({ orderId: order.id, status: "refund_failed" }, 502);
  }

  if (result.ok && result.data?.RtnCode === "1") {
    const { error: markErr } = await svc.rpc("mark_refund_processed", {
      p_order_id: order.id,
      p_provider_refund_ref: result.data.TradeNo || order.provider_ref,
    });
    if (markErr) {
      console.error("mark_refund_processed failed after ECPay success:", markErr.message);
      return json({ error: "refund_succeeded_but_mark_failed" }, 500);
    }
    return json({ orderId: order.id, status: "refunded" });
  }

  const { error: failErr } = await svc.rpc("mark_refund_failed", {
    p_order_id: order.id,
    p_provider_refund_error:
      `status=${result.status} RtnCode=${result.data?.RtnCode ?? "?"} ` +
      `RtnMsg=${result.data?.RtnMsg ?? "?"} raw=${result.raw.slice(0, 300)}`,
  });
  if (failErr) {
    console.error("mark_refund_failed failed after ECPay failure:", failErr.message);
    return json({ error: "refund_failed_and_mark_failed" }, 500);
  }
  return json({ orderId: order.id, status: "refund_failed" }, 502);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "unauthorized" }, 401);

  const svc = serviceClient();
  const { data: userData, error: userErr } = await svc.auth.getUser(jwt);
  const user = userData?.user;
  if (userErr || !user) return json({ error: "unauthorized" }, 401);

  let body: { servicePeriodId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const servicePeriodId = body.servicePeriodId;
  if (!servicePeriodId) return json({ error: "service_period_id_required" }, 400);

  // 1. Core: atomic termination + refund calculation. Re-validates
  // ownership and current validity itself (service_periods.user_id =
  // p_user_id in the RPC's own guard) -- does not trust the caller's JWT
  // alone to imply the period belongs to them beyond that check.
  const { error: termErr } = await svc.rpc("apply_service_period_early_termination", {
    p_service_period_id: servicePeriodId,
    p_user_id: user.id,
  });

  if (termErr) {
    if (termErr.message?.includes("service_period_not_eligible_for_termination")) {
      return json({ error: "service_period_not_eligible" }, 409);
    }
    if (termErr.message?.includes("order_not_eligible_for_refund")) {
      return json({ error: "order_not_eligible_for_refund" }, 409);
    }
    console.error("apply_service_period_early_termination failed:", termErr.message);
    return json({ error: "termination_failed" }, 500);
  }

  const { data: period, error: periodErr } = await svc
    .from("service_periods")
    .select("order_id")
    .eq("id", servicePeriodId)
    .single();
  if (periodErr || !period) {
    console.error("service_periods lookup failed after termination:", periodErr?.message);
    return json({ error: "termination_recorded_but_order_lookup_failed" }, 500);
  }

  const { data: order, error: orderErr } = await svc
    .from("orders")
    .select("id, provider, provider_checkout_ref, provider_ref, payment_method, refund_amount")
    .eq("id", period.order_id)
    .single();
  if (orderErr || !order) {
    console.error("orders lookup failed after termination:", orderErr?.message);
    return json({ error: "termination_recorded_but_order_lookup_failed" }, 500);
  }

  // Termination + refund calculation are already committed at this point
  // regardless of what happens below -- the Order sits in refund_processing
  // either way, which is the correct, already-visible state.
  if (order.provider === ECPAY_PROVIDER_NAME) {
    return await refundViaEcpay(svc, order);
  }
  if (order.provider !== OEN_PROVIDER_NAME) {
    return json({
      orderId: order.id,
      status: "refund_processing",
      note: "no_automated_refund_path_for_this_provider",
    });
  }
  if (order.payment_method && order.payment_method !== "card") {
    // Oen's refund API is card-only; CVS/ATM must be processed manually
    // via the Oen CRM dashboard. Not expected in practice today (JOTI only
    // ever charges by card), but checked rather than assumed.
    return json({
      orderId: order.id,
      status: "refund_processing",
      note: "manual_refund_required_non_card_payment_method",
    });
  }

  const transactionHid = order.provider_ref;
  if (!transactionHid) {
    console.error("order has no provider_ref, cannot call Oen refund:", order.id);
    return json({ orderId: order.id, status: "refund_processing", note: "missing_provider_ref" });
  }

  // 2. Provider: the actual refund call. A clean response (success or
  // failure) finalizes immediately; a thrown error means the HTTP outcome
  // itself is ambiguous (timeout / network failure), not that the refund
  // definitely did not happen -- re-query before deciding.
  let refundResult;
  try {
    refundResult = await refundOenOrder({
      transactionHid,
      amount: order.refund_amount,
    });
  } catch (e) {
    console.error("refundOenOrder threw, re-querying before finalizing:", (e as Error).message);
    const requery = await getTransaction(transactionHid).catch((e2) => {
      console.error("post-ambiguity re-query also threw:", (e2 as Error).message);
      return null;
    });

    const requeried = requery?.ok && requery.json?.code === "S0000"
      ? (requery.json.data as Record<string, unknown>)
      : null;

    if (requeried?.status === "refunded") {
      const { error: markErr } = await svc.rpc("mark_refund_processed", {
        p_order_id: order.id,
        p_provider_refund_ref: transactionHid,
      });
      if (markErr) {
        console.error("mark_refund_processed failed after re-query confirmed refund:", markErr.message);
        return json({ error: "refund_confirmed_but_mark_failed" }, 500);
      }
      return json({ orderId: order.id, status: "refunded" });
    }

    const { error: failErr } = await svc.rpc("mark_refund_failed", {
      p_order_id: order.id,
      p_provider_refund_error: `network_uncertain: ${(e as Error).message}`,
    });
    if (failErr) {
      console.error("mark_refund_failed failed after network ambiguity:", failErr.message);
      return json({ error: "refund_uncertain_and_mark_failed" }, 500);
    }
    return json({ orderId: order.id, status: "refund_failed" }, 502);
  }

  // 3. Clean HTTP response received -- finalize directly from it.
  if (
    refundResult.ok &&
    refundResult.json?.code === "S0000" &&
    refundResult.json.data?.status === "refunded"
  ) {
    const { error: markErr } = await svc.rpc("mark_refund_processed", {
      p_order_id: order.id,
      p_provider_refund_ref: transactionHid,
    });
    if (markErr) {
      console.error("mark_refund_processed failed after clean success:", markErr.message);
      return json({ error: "refund_succeeded_but_mark_failed" }, 500);
    }
    return json({ orderId: order.id, status: "refunded" });
  }

  const { error: failErr } = await svc.rpc("mark_refund_failed", {
    p_order_id: order.id,
    p_provider_refund_error:
      `status=${refundResult.status} code=${refundResult.json?.code ?? "?"} ` +
      `message=${refundResult.json?.message ?? "?"}`,
  });
  if (failErr) {
    console.error("mark_refund_failed failed after clean provider failure:", failErr.message);
    return json({ error: "refund_failed_and_mark_failed" }, 500);
  }
  return json({ orderId: order.id, status: "refund_failed" }, 502);
});
