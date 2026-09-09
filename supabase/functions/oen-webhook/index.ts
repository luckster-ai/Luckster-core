// Payment Phase 1 -- Oen TEST first-subscription MVP.
//
// Oen (server-to-server, unsigned) -> this function.
//
// The webhook body is treated as an untrusted hint. Flow:
//   1. merchant sanity check
//   2. idempotency anchor: insert-or-skip into payment_events (A7, crash-safe)
//   3. act only on a successful subscription charge (purpose=charge,
//      action=subscription, success=true, status=charged)
//   4. MANDATORY re-query verification against the Oen API (A6) -- no
//      signature exists, so entitlement is only ever granted from the
//      authenticated read-back, never from the webhook payload
//   5. resolve the user ONLY from our own subscription_checkouts.order_id
//      (A5 -- customId is never an identity fallback)
//   6. atomic activation via the one trusted writer RPC
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

  // 3. act only on a successful subscription charge
  const actionable = purpose === "charge" && action === "subscription" &&
    success && status === "charged";
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
    p_current_period_end: body.nextChargeAt ?? null,
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
});
