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
//   5. resolve the Checkout Session ONLY from our own checkout_sessions row
//      (provider='ecpay' + merchant_trade_no = MerchantTradeNo, A5);
//      CustomField1 (the session id) is only a cross-check, never an
//      identity fallback
//   6. fulfil via ../_shared/ecpayFulfillment.ts -- the same re-query +
//      fulfill_checkout_session() path confirm-checkout-session uses, which
//      creates the paid Order + Service Period (no Order exists before
//      this point), or rejects the session for manual refund
//
// Non-success notifications (RtnCode != 1) are recorded and change
// nothing: the session stays open (a later successful payment on the same
// MerchantTradeNo is still accepted), and simply stops blocking a new
// purchase once its expires_at passes.
//
// Response contract (ECPay docs): body "1|OK" acknowledges; anything else
// makes ECPay resend every 5-15 minutes, up to 4 times that day. "1|OK" is
// returned for everything handled or deliberately ignored; a non-1|OK
// response is returned only for a transient internal failure or a
// misconfigured environment (so ECPay's resend re-runs the idempotent flow
// once fixed) or an invalid CheckMacValue.
//
// Runs in both TEST and LIVE: ECPAY_MODE is recorded on every
// payment_events row, and ecpayConfigError() refuses to process anything
// when the mode and payment host do not match.

import { serviceClient } from "../_shared/db.ts";
import {
  ECPAY_MERCHANT_ID,
  ECPAY_MODE,
  ecpayConfigError,
  verifyCheckMacValue,
} from "../_shared/ecpay.ts";
import { ECPAY_PROVIDER_NAME } from "../_shared/ecpayAdapter.ts";
import { verifyAndFulfillEcpaySession } from "../_shared/ecpayFulfillment.ts";

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
      mode: ECPAY_MODE,
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

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return ack();

  // Never process anything on a misconfigured environment (mode / host
  // mismatch, missing secrets) -- and do not acknowledge either, so ECPay
  // keeps resending and the payment is not lost once the config is fixed.
  const cfgErr = ecpayConfigError();
  if (cfgErr) {
    console.error("ecpay-webhook misconfigured:", cfgErr);
    return retry("config");
  }

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
    mode: ECPAY_MODE,
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

  // 5. resolve the Checkout Session ONLY from our own records (A5).
  // Historic order-first ECPay Orders (pending_payment TEST data) are
  // deliberately NOT looked up -- there is no transition path for them.
  const { data: session } = await svc.from("checkout_sessions")
    .select("id, user_id, merchant_trade_no, amount, status")
    .eq("provider", ECPAY_PROVIDER_NAME)
    .eq("merchant_trade_no", merchantTradeNo)
    .maybeSingle();

  if (!session) {
    await finish(svc, eventKey, {
      verification_status: "verification_failed",
      note: "session_not_matched",
    });
    return ack();
  }

  if (body.CustomField1 && body.CustomField1 !== session.id) {
    await finish(svc, eventKey, {
      user_id: session.user_id,
      verification_status: "verification_failed",
      note: "custom_field_mismatch",
    });
    return ack();
  }

  // 4 + 6. MANDATORY re-query (A6) + idempotent fulfilment -- the same
  // shared path confirm-checkout-session uses.
  const result = await verifyAndFulfillEcpaySession(svc, session, {
    tradeNo,
    amount: bodyAmount,
    paymentType: body.PaymentType || "",
  });

  switch (result.kind) {
    case "fulfilled":
      await finish(svc, eventKey, {
        order_id: result.orderId,
        user_id: session.user_id,
        verification_status: "verified",
        note: result.alreadyFulfilled ? "already_fulfilled" : null,
      });
      return ack();
    case "rejected":
      // Money taken, no Order / Service Period -> manual refund
      // (checkout_sessions.status = 'rejected' is the work list).
      await finish(svc, eventKey, {
        user_id: session.user_id,
        verification_status: "verification_failed",
        note: `paid_but_rejected:${result.reason}`,
      });
      return ack();
    case "mismatch":
      await finish(svc, eventKey, {
        user_id: session.user_id,
        verification_status: "verification_failed",
        note: result.note,
      });
      return ack();
    case "not_paid":
      // RtnCode=1 but ECPay does not report it paid yet -> resend.
      console.error("QueryTradeInfo not yet paid:", result.tradeStatus);
      return retry("requery_not_paid_yet");
    case "unavailable":
      return retry(result.note);
  }
});
