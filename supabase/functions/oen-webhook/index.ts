// Payment Phase 1 -- Oen TEST first-subscription MVP.
// Payment Rebuild -- Step 7: Oen one-time Order webhook + server-side
// verification added alongside it (see the `action === "onetime"` branch
// below). Oen's merchant backend only supports ONE webhook URL per
// merchant (confirmed in Step 7 Discovery), so both flows necessarily
// share this single Edge Function -- they do not share any table, RPC, or
// business logic beyond the action-agnostic steps 1-2 below.
//
// Oen (server-to-server, unsigned) -> this function.
//
// The webhook body is treated as an untrusted hint. Flow:
//   1. merchant sanity check
//   2. idempotency anchor: insert-or-skip into payment_events (A7, crash-safe)
//   3. branch by body.action:
//      - "subscription" (Legacy, unchanged): act only on a successful
//        subscription charge (purpose=charge, success=true, status=charged)
//      - "onetime" (Step 7, new): act on a charge's terminal outcome
//        (status=charged -> Core's apply_order_payment(); status=failed ->
//        Core's mark_payment_failed() -- Oen TEST behaviour verified
//        2026-10-02: a failed one-time checkout terminates the checkout
//        session, it cannot later produce a charged event for the same
//        provider_checkout_ref, so this is safe)
//      - anything else: skipped
//   4. MANDATORY re-query verification against the Oen API (A6) -- no
//      signature exists, so entitlement is only ever granted from the
//      authenticated read-back, never from the webhook payload
//   5. resolve the Order/user ONLY from our own records (subscription:
//      subscription_checkouts.order_id; onetime: orders.provider +
//      orders.provider_checkout_ref + orders.id -- A5, customId is never
//      an identity fallback in either branch)
//   6. atomic activation via the one trusted writer RPC (subscription:
//      apply_oen_subscription_charge(); onetime: Core's
//      apply_order_payment() / mark_payment_failed())
//
// Always returns 200 (acknowledge) EXCEPT on a transient internal failure
// after the event was already recorded, where 500 lets Oen retry and the
// idempotent RPC re-runs safely.

import { serviceClient } from "../_shared/db.ts";
import {
  getSubscription,
  getTransaction,
  MERCHANT_ID,
  OEN_MODE,
  oenConfigError,
} from "../_shared/oen.ts";

// deno-lint-ignore no-explicit-any
type Json = Record<string, any>;
// deno-lint-ignore no-explicit-any
type Svc = any;

function ack(extra: Record<string, unknown> = {}): Response {
  return new Response(JSON.stringify({ received: true, ...extra }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function retry(reason: string): Response {
  return new Response(JSON.stringify({ received: false, reason }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

async function recordAnomaly(svc: Svc, body: unknown, note: string): Promise<void> {
  try {
    await svc.from("payment_events").insert({
      provider: "oen",
      event_key: `anomaly:${note}:${crypto.randomUUID()}`,
      event_type: "anomaly",
      mode: "test",
      raw_payload: body ?? {},
      verification_status: "verification_failed",
      note,
      processed_at: new Date().toISOString(),
    });
  } catch {
    // best effort
  }
}

async function finish(
  svc: Svc,
  eventKey: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await svc.from("payment_events")
    .update({ ...patch, processed_at: new Date().toISOString() })
    .eq("provider", "oen")
    .eq("event_key", eventKey);
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return ack({ ignored: "method" });

  // Never process anything unless configured for TEST.
  if (OEN_MODE !== "test") return ack({ ignored: "not_test_mode" });
  if (oenConfigError()) return ack({ ignored: "misconfigured" });

  let body: Json;
  try {
    body = await req.json();
  } catch {
    return ack({ ignored: "unparseable" });
  }

  const svc = serviceClient();

  // 1. merchant sanity
  if (!body || body.merchantId !== MERCHANT_ID) {
    await recordAnomaly(svc, body, "merchant_mismatch");
    return ack({ ignored: "merchant_mismatch" });
  }

  const purpose = String(body.purpose ?? "");
  const status = String(body.status ?? "");
  const action = String(body.action ?? "");
  const success = body.success === true || body.success === "true";

  const eventKey = purpose === "charge" && body.transactionHid
    ? `${body.transactionHid}:${status}`
    : `${body.id ?? crypto.randomUUID()}:${purpose || "unknown"}`;
  const eventType = `${purpose || "?"}.${action || "?"}.${status || "?"}`;

  // 2. idempotency anchor (A7)
  const { error: insErr } = await svc.from("payment_events").insert({
    provider: "oen",
    event_key: eventKey,
    event_type: eventType,
    mode: "test",
    transaction_hid: body.transactionHid ?? null,
    provider_subscription_id: body.subscriptionId ?? null,
    raw_payload: body,
    verification_status: "skipped",
  });

  if (insErr) {
    if (insErr.code !== "23505") {
      // Not a unique violation -> transient. Nothing recorded; let Oen retry.
      console.error("payment_events insert failed:", insErr.message);
      return retry("event_insert_failed");
    }
    // Unique violation -> already seen. Done only if a prior attempt finished.
    const { data: prior } = await svc.from("payment_events")
      .select("processed_at")
      .eq("provider", "oen")
      .eq("event_key", eventKey)
      .maybeSingle();
    if (prior?.processed_at) return ack({ duplicate: true });
    // else: prior attempt crashed before finishing -> fall through and retry.
  }

  // 3. branch by action -- the two flows share nothing below this point
  // except the finish()/ack()/retry() helpers themselves.
  if (action === "subscription") {
    // Legacy subscription flow -- UNCHANGED from before Step 7, kept
    // exactly as originally implemented/tested. Do not modify this branch
    // when working on the onetime branch below; subscription/recurring
    // capability is deliberately retained for a possible future product.
    const actionable = purpose === "charge" && success && status === "charged";
    if (!actionable) {
      await finish(svc, eventKey, { verification_status: "skipped" });
      return ack({ skipped: true });
    }

    // 4. MANDATORY re-query verification (A6)
    const subId = String(body.subscriptionId ?? "");
    const hid = String(body.transactionHid ?? "");
    const amount = Number(body.amount);
    if (!subId || !hid || !Number.isFinite(amount)) {
      await finish(svc, eventKey, {
        verification_status: "verification_failed",
        note: "missing_fields",
      });
      return ack({ verification_failed: "missing_fields" });
    }

    // The re-query call itself failing (network / DNS / timeout) is NOT a
    // verification failure -- return 500 so Oen retries and we verify again.
    const requery = await Promise.all([
      getSubscription(subId),
      getTransaction(hid),
    ]).catch((e) => {
      console.error("re-query threw:", (e as Error).message);
      return null;
    });
    if (!requery) return retry("requery_threw");
    const [sub, txn] = requery;

    // Distinguish "re-query unavailable" (transient infra) from "re-query
    // says the data does not match" (genuine failure). Only the latter is a
    // terminal verification_failed; the former is retried.
    const subUsable = sub.ok && sub.json?.code === "S0000";
    const txnUsable = txn.ok && txn.json?.code === "S0000";
    if (!subUsable || !txnUsable) {
      console.error(
        "re-query unavailable:",
        "sub", sub.status, sub.json?.code ?? "(none)",
        "txn", txn.status, txn.json?.code ?? "(none)",
      );
      return retry("requery_unavailable");
    }

    const subData = sub.json!.data as Json;
    const txnData = txn.json!.data as Json;

    const subOk = (subData.status === "ongoing" || subData.status === "waiting") &&
      Number(subData.amount) === amount;
    const txnOk = txnData.status === "charged" &&
      Number(txnData.amount) === amount &&
      (txnData.orderId == null || txnData.orderId === body.orderId);

    if (!subOk || !txnOk) {
      await finish(svc, eventKey, {
        verification_status: "verification_failed",
        note:
          `subOk=${subOk} txnOk=${txnOk} subStatus=${subData.status ?? "?"} txnStatus=${txnData.status ?? "?"}`,
      });
      return ack({ verification_failed: true });
    }

    // 5. resolve user ONLY from our own subscription_checkouts.order_id (A5)
    const orderId = String(body.orderId ?? "");
    if (!orderId) {
      await finish(svc, eventKey, { verification_status: "verified", note: "no_order_id" });
      return ack({ unresolved: "no_order_id" });
    }
    const { data: checkoutRow } = await svc.from("subscription_checkouts")
      .select("user_id, plan_id, mode")
      .eq("order_id", orderId)
      .maybeSingle();
    if (!checkoutRow) {
      await finish(svc, eventKey, { verification_status: "verified", note: "order_not_found" });
      return ack({ unresolved: "order_not_found" });
    }
    if (checkoutRow.mode !== "test") {
      await finish(svc, eventKey, { verification_status: "verified", note: "checkout_not_test" });
      return ack({ unresolved: "checkout_not_test" });
    }

    const userId: string = checkoutRow.user_id;
    const customIdMatches = body.customId === userId;

    // 6. atomic activation via the one trusted writer
    const { error: rpcErr } = await svc.rpc("apply_oen_subscription_charge", {
      p_user_id: userId,
      p_provider_subscription_id: subId,
      p_plan_id: checkoutRow.plan_id,
      p_amount: amount,
      // T-2 Test 2: the charge webhook body does not carry nextChargeAt at
      // all -- only the re-queried subscription (subData, step 4) does.
      p_current_period_end: subData.nextChargeAt ?? null,
      p_started_at: body.paidAt ?? new Date().toISOString(),
      p_transaction_hid: hid,
      p_order_id: orderId,
      p_mode: "test",
      p_raw: body,
    });

    if (rpcErr) {
      // Event row already recorded; 500 -> Oen retries -> idempotent RPC re-runs.
      console.error("apply_oen_subscription_charge failed:", rpcErr.message);
      return retry("rpc_failed");
    }

    await finish(svc, eventKey, {
      verification_status: "verified",
      user_id: userId,
      provider_subscription_id: subId,
      note: customIdMatches ? null : "customId_mismatch",
    });

    return ack({ activated: true });
  }

  if (action === "onetime") {
    // Payment Rebuild -- Step 7: Core's one-time Order flow (Step 5/6).
    // Never touches subscription_checkouts / apply_oen_subscription_charge.
    //
    // orders.provider_checkout_ref corresponds to body.id / body.transactionId
    // (confirmed against a real Oen TEST payload and the orders row it
    // belongs to, 2026-10-02 -- NOT transactionHid, which is a different,
    // independent value used only for the mandatory re-query below).
    const checkoutRef = String(body.id ?? body.transactionId ?? "");
    const orderIdFromBody = String(body.orderId ?? "");

    // Oen TEST behaviour verified 2026-10-02: a failed one-time checkout
    // terminates that checkout session immediately (revisiting the same
    // checkout URL shows a terminal error page, no retry form) -- so a
    // "failed" event can never be followed by a "charged" event for the
    // same provider_checkout_ref. Safe to mark the Order failed directly,
    // no intermediate state needed.
    if (purpose === "charge" && status === "failed") {
      if (!checkoutRef || !orderIdFromBody) {
        await finish(svc, eventKey, {
          verification_status: "verification_failed",
          note: "missing_fields",
        });
        return ack({ verification_failed: "missing_fields" });
      }

      const { data: order } = await svc.from("orders")
        .select("id, user_id, payment_attempt")
        .eq("id", orderIdFromBody)
        .eq("provider", "oen")
        .eq("provider_checkout_ref", checkoutRef)
        .maybeSingle();

      if (!order) {
        await finish(svc, eventKey, {
          verification_status: "verification_failed",
          note: "order_not_matched",
        });
        return ack({ unresolved: "order_not_matched" });
      }

      const { error: failErr } = await svc.rpc("mark_payment_failed", {
        p_order_id: order.id,
        p_payment_attempt: order.payment_attempt,
      });

      if (failErr) {
        if (failErr.message?.includes("order_not_eligible_for_failure_marking")) {
          await finish(svc, eventKey, {
            order_id: order.id,
            user_id: order.user_id,
            verification_status: "verification_failed",
            note: "order_not_eligible_for_failure_marking",
          });
          return ack({ unresolved: "order_not_eligible_for_failure_marking" });
        }
        console.error("mark_payment_failed failed:", failErr.message);
        return retry("mark_payment_failed_rpc_failed");
      }

      await finish(svc, eventKey, {
        order_id: order.id,
        user_id: order.user_id,
        verification_status: "verified",
        note: "payment_failed",
      });
      return ack({ marked_failed: true });
    }

    const actionable = purpose === "charge" && success && status === "charged";
    if (!actionable) {
      await finish(svc, eventKey, { verification_status: "skipped" });
      return ack({ skipped: true });
    }

    // 4. MANDATORY re-query verification (A6) -- same principle as the
    // subscription branch: entitlement is only ever granted from this
    // authenticated read-back, never from the webhook payload.
    const hid = String(body.transactionHid ?? "");
    const bodyAmount = Number(body.amount);
    if (!checkoutRef || !orderIdFromBody || !hid || !Number.isFinite(bodyAmount)) {
      await finish(svc, eventKey, {
        verification_status: "verification_failed",
        note: "missing_fields",
      });
      return ack({ verification_failed: "missing_fields" });
    }

    const txn = await getTransaction(hid).catch((e) => {
      console.error("re-query threw:", (e as Error).message);
      return null;
    });
    if (!txn) return retry("requery_threw");

    const txnUsable = txn.ok && txn.json?.code === "S0000";
    if (!txnUsable) {
      console.error(
        "re-query unavailable:",
        "txn", txn.status, txn.json?.code ?? "(none)",
      );
      return retry("requery_unavailable");
    }
    const txnData = txn.json!.data as Json;

    // 5. resolve the Order ONLY from our own orders row -- provider +
    // provider_checkout_ref + id must all match (A5; body.customId is
    // never an identity fallback, same principle as the subscription
    // branch's subscription_checkouts lookup).
    const { data: order } = await svc.from("orders")
      .select("id, user_id, amount, currency, payment_attempt")
      .eq("id", orderIdFromBody)
      .eq("provider", "oen")
      .eq("provider_checkout_ref", checkoutRef)
      .maybeSingle();

    if (!order) {
      await finish(svc, eventKey, {
        verification_status: "verification_failed",
        note: "order_not_matched",
      });
      return ack({ unresolved: "order_not_matched" });
    }

    // Per GET /transactions/:id's documented response shape, txnData.id is
    // the human-readable Hid (matches transactionHid, NOT the checkout
    // ref) -- so this re-query is cross-checked against the Order via
    // amount/status/action/orderId, not txnData.id/transactionId.
    const statusOk = txnData.status === "charged";
    const actionOk = txnData.action === "onetime";
    const amountOk = Number(txnData.amount) === order.amount && bodyAmount === order.amount;
    const currencyOk = String(body.currency ?? "").toUpperCase() === order.currency;
    const orderIdOk = txnData.orderId == null || txnData.orderId === orderIdFromBody;

    if (!statusOk || !actionOk || !amountOk || !currencyOk || !orderIdOk) {
      await finish(svc, eventKey, {
        order_id: order.id,
        user_id: order.user_id,
        verification_status: "verification_failed",
        note:
          `statusOk=${statusOk} actionOk=${actionOk} amountOk=${amountOk} ` +
          `currencyOk=${currencyOk} orderIdOk=${orderIdOk}`,
      });
      return ack({ verification_failed: true });
    }

    // 6. atomic activation via the one trusted writer (Core's own RPC --
    // this is the first real caller since it was defined in Step 5).
    const { error: rpcErr } = await svc.rpc("apply_order_payment", {
      p_order_id: order.id,
      p_payment_attempt: order.payment_attempt,
      p_provider: "oen",
      p_provider_ref: hid,
      p_payment_method: String(body.paymentMethod ?? "card"),
      p_verified_amount: order.amount,
    });

    if (rpcErr) {
      if (rpcErr.message?.includes("order_not_eligible_for_payment")) {
        // Stale/duplicate attempt (already paid, expired, or a payment_attempt
        // mismatch from a retry) -- terminal, not transient; do not retry.
        await finish(svc, eventKey, {
          order_id: order.id,
          user_id: order.user_id,
          verification_status: "verification_failed",
          note: "order_not_eligible_for_payment",
        });
        return ack({ unresolved: "order_not_eligible_for_payment" });
      }
      console.error("apply_order_payment failed:", rpcErr.message);
      return retry("apply_order_payment_rpc_failed");
    }

    await finish(svc, eventKey, {
      order_id: order.id,
      user_id: order.user_id,
      verification_status: "verified",
    });
    return ack({ activated: true });
  }

  // Unknown/unhandled action (neither "subscription" nor "onetime").
  await finish(svc, eventKey, { verification_status: "skipped" });
  return ack({ skipped: true });
});
