// ECPay integration: ECPay AIO payment result notification (ReturnURL).
//
// ECPay (server-to-server, form POST, signed with CheckMacValue) -> this
// function. Separate from oen-webhook on purpose: different wire format,
// different signature scheme, different required acknowledgement -- the
// two share no code, only the same Core RPCs and the same design:
//   1. CheckMacValue verification + merchant sanity check (ECPay signs its
//      notifications, unlike Oen -- an invalid signature is never acted on)
//   2. idempotency anchor: insert-or-skip into payment_events (A7,
//      crash-safe, same pattern as oen-webhook)
//   3. act only on RtnCode=1 (paid) for a real (non-simulated) payment
//   4. MANDATORY re-query via QueryTradeInfo (A6) -- entitlement is only
//      ever granted from the authenticated read-back, never from the
//      notification body alone, even though it is signed
//   5. resolve the Order ONLY from our own orders row (provider='ecpay' +
//      provider_checkout_ref = MerchantTradeNo, A5); CustomField1 is only a
//      cross-check, never an identity fallback
//   6. atomic activation via Core's apply_order_payment()
//
// Non-success notifications (RtnCode != 1) are recorded but do NOT mark the
// Order payment_failed: unlike Oen (verified terminal), it is not
// established that a failed ECPay credit attempt cannot be followed by a
// successful one for the same MerchantTradeNo, so marking it failed could
// strand a later real payment. The Order stays pending_payment and expires
// through the normal 3-day window; the member can start a new Order.
//
// Response contract (ECPay docs): body "1|OK" acknowledges; anything else
// makes ECPay resend every 5-15 minutes, up to 4 times that day. "1|OK" is
// returned for everything handled or deliberately ignored; a non-1|OK
// response is returned only for a transient internal failure (so ECPay's
// resend re-runs the idempotent flow) or an invalid CheckMacValue.

import { serviceClient } from "../_shared/db.ts";
import {
  ECPAY_MERCHANT_ID,
  ECPAY_MODE,
  ecpayConfigError,
  queryTradeInfo,
  verifyCheckMacValue,
} from "../_shared/ecpay.ts";
import { ECPAY_PROVIDER_NAME } from "../_shared/ecpayAdapter.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

function text(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "text/plain" } });
}

const ack = () => text("1|OK");
const retry = (reason: string) => text(`0|${reason}`, 500);

async function recordAnomaly(svc: Svc, body: unknown, note: string): Promise<void> {
  try {
    await svc.from("payment_events").insert({
      provider: ECPAY_PROVIDER_NAME,
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
    .eq("provider", ECPAY_PROVIDER_NAME)
    .eq("event_key", eventKey);
}

// ECPay PaymentType for a credit card charge is "Credit_CreditCard";
// terminate-service-period's refund guard expects the provider-neutral
// value "card" (the same one the Oen path stores).
function normalizePaymentMethod(paymentType: string): string {
  return paymentType.startsWith("Credit") ? "card" : paymentType;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return ack();

  // Never process anything unless configured for TEST.
  if (ECPAY_MODE !== "test") return ack();
  if (ecpayConfigError()) return ack();

  let body: Record<string, string>;
  try {
    body = Object.fromEntries(new URLSearchParams(await req.text()));
  } catch {
    return ack();
  }

  const svc = serviceClient();

  // 1. signature + merchant sanity
  if (!(await verifyCheckMacValue(body))) {
    await recordAnomaly(svc, body, "checkmac_invalid");
    return text("0|CheckMacValueError", 400);
  }
  if (body.MerchantID !== ECPAY_MERCHANT_ID) {
    await recordAnomaly(svc, body, "merchant_mismatch");
    return ack();
  }

  const merchantTradeNo = body.MerchantTradeNo ?? "";
  const tradeNo = body.TradeNo ?? "";
  const rtnCode = body.RtnCode ?? "";
  const simulated = body.SimulatePaid === "1";

  const eventKey = `${tradeNo || merchantTradeNo || crypto.randomUUID()}:${rtnCode || "?"}`;
  const eventType = `payment.${body.PaymentType || "?"}.${rtnCode || "?"}`;

  // 2. idempotency anchor (A7)
  const { error: insErr } = await svc.from("payment_events").insert({
    provider: ECPAY_PROVIDER_NAME,
    event_key: eventKey,
    event_type: eventType,
    mode: "test",
    transaction_hid: tradeNo || null,
    raw_payload: body,
    verification_status: "skipped",
  });

  if (insErr) {
    if (insErr.code !== "23505") {
      // Not a unique violation -> transient. Nothing recorded; let ECPay resend.
      console.error("payment_events insert failed:", insErr.message);
      return retry("event_insert_failed");
    }
    // Unique violation -> already seen. Done only if a prior attempt finished.
    const { data: prior } = await svc.from("payment_events")
      .select("processed_at")
      .eq("provider", ECPAY_PROVIDER_NAME)
      .eq("event_key", eventKey)
      .maybeSingle();
    if (prior?.processed_at) return ack();
    // else: prior attempt crashed before finishing -> fall through and retry.
  }

  // 3. actionable only for a real successful payment
  if (rtnCode !== "1") {
    await finish(svc, eventKey, { verification_status: "skipped", note: `rtn_code_${rtnCode || "?"}` });
    return ack();
  }
  if (simulated) {
    // ECPay backend "模擬付款" -- per ECPay docs never to be fulfilled.
    await finish(svc, eventKey, { verification_status: "skipped", note: "simulated_payment" });
    return ack();
  }

  const bodyAmount = Number(body.TradeAmt);
  if (!merchantTradeNo || !tradeNo || !Number.isFinite(bodyAmount)) {
    await finish(svc, eventKey, {
      verification_status: "verification_failed",
      note: "missing_fields",
    });
    return ack();
  }

  // 5. resolve the Order ONLY from our own records (A5)
  const { data: order } = await svc.from("orders")
    .select("id, user_id, amount, payment_attempt, scheduled_service_start")
    .eq("provider", ECPAY_PROVIDER_NAME)
    .eq("provider_checkout_ref", merchantTradeNo)
    .maybeSingle();

  if (!order) {
    await finish(svc, eventKey, {
      verification_status: "verification_failed",
      note: "order_not_matched",
    });
    return ack();
  }

  // 4. MANDATORY re-query verification (A6). The call itself failing, or
  // ECPay not yet reporting the trade as paid, is transient -> resend.
  const requery = await queryTradeInfo(merchantTradeNo).catch((e) => {
    console.error("QueryTradeInfo threw:", (e as Error).message);
    return null;
  });
  if (!requery) return retry("requery_threw");
  if (!requery.ok || !requery.data || !requery.macValid) {
    console.error(
      "QueryTradeInfo unavailable:",
      requery.status,
      `macValid=${requery.macValid}`,
      requery.raw.slice(0, 200),
    );
    return retry("requery_unavailable");
  }
  const q = requery.data;
  if (q.TradeStatus !== "1") {
    console.error("QueryTradeInfo not yet paid:", q.TradeStatus);
    return retry("requery_not_paid_yet");
  }

  const tradeNoOk = q.TradeNo === tradeNo;
  const amountOk = Number(q.TradeAmt) === order.amount && bodyAmount === order.amount;
  const customFieldOk = !body.CustomField1 || body.CustomField1 === order.id;

  if (!tradeNoOk || !amountOk || !customFieldOk) {
    await finish(svc, eventKey, {
      order_id: order.id,
      user_id: order.user_id,
      verification_status: "verification_failed",
      note: `tradeNoOk=${tradeNoOk} amountOk=${amountOk} customFieldOk=${customFieldOk}`,
    });
    return ack();
  }

  // 6. atomic activation via Core's one trusted writer -- identical call
  // shape to oen-webhook's onetime branch.
  const { error: rpcErr } = await svc.rpc("apply_order_payment", {
    p_order_id: order.id,
    p_payment_attempt: order.payment_attempt,
    p_provider: ECPAY_PROVIDER_NAME,
    p_provider_ref: tradeNo,
    p_payment_method: normalizePaymentMethod(q.PaymentType || body.PaymentType || ""),
    p_verified_amount: order.amount,
    p_service_period_start: order.scheduled_service_start,
  });

  if (rpcErr) {
    if (rpcErr.message?.includes("order_not_eligible_for_payment")) {
      // Stale/duplicate attempt (already paid, expired, or a payment_attempt
      // mismatch) -- terminal, not transient; do not ask ECPay to resend.
      await finish(svc, eventKey, {
        order_id: order.id,
        user_id: order.user_id,
        verification_status: "verification_failed",
        note: "order_not_eligible_for_payment",
      });
      return ack();
    }
    console.error("apply_order_payment failed:", rpcErr.message);
    return retry("apply_order_payment_rpc_failed");
  }

  await finish(svc, eventKey, {
    order_id: order.id,
    user_id: order.user_id,
    verification_status: "verified",
  });
  return ack();
});
