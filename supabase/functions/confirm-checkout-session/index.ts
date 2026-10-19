// ECPay Checkout Session flow: called by /checkout/return when the member
// comes back from ECPay.
//
// ECPay's ClientBackURL carries no payment result and ecpay-webhook may
// arrive later than the member does, so this function lets the return
// page ask JOTI to check right now: for the caller's OWN open session it
// re-queries ECPay (QueryTradeInfo) and, if the trade is paid, fulfils it
// through exactly the same shared path the webhook uses
// (../_shared/ecpayFulfillment.ts -> fulfill_checkout_session()). The two
// can race freely: fulfil is idempotent and serialised on the session row,
// so whichever arrives second just sees the session already fulfilled.
//
// Never trusts anything from the browser beyond the session id (which is
// ownership-checked); a session that is no longer open is simply reported
// as-is without contacting ECPay.

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";
import { ECPAY_MODE, ecpayConfigError } from "../_shared/ecpay.ts";
import { ECPAY_PROVIDER_NAME } from "../_shared/ecpayAdapter.ts";
import {
  type FulfilmentResult,
  verifyAndFulfillEcpaySession,
} from "../_shared/ecpayFulfillment.ts";

// deno-lint-ignore no-explicit-any
type Svc = any;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Audit trail for outcomes reached through this path (the webhook keeps
// its own payment_events rows). Best effort; a duplicate key just means
// the same outcome was already recorded.
async function recordConfirmEvent(
  svc: Svc,
  session: { id: string; user_id: string; merchant_trade_no: string },
  result: FulfilmentResult,
): Promise<void> {
  if (result.kind !== "fulfilled" && result.kind !== "rejected" && result.kind !== "mismatch") return;
  if (result.kind === "fulfilled" && result.alreadyFulfilled) return;
  try {
    await svc.from("payment_events").insert({
      provider: ECPAY_PROVIDER_NAME,
      event_key: `confirm:${result.tradeNo || session.merchant_trade_no}:${result.kind}`,
      event_type: "confirm.query_trade_info",
      mode: ECPAY_MODE,
      user_id: session.user_id,
      order_id: result.kind === "fulfilled" ? result.orderId : null,
      transaction_hid: result.tradeNo || null,
      raw_payload: { checkoutSessionId: session.id, merchantTradeNo: session.merchant_trade_no, result },
      verification_status: result.kind === "fulfilled" ? "verified" : "verification_failed",
      note: result.kind === "rejected"
        ? `paid_but_rejected:${result.reason}`
        : result.kind === "mismatch"
        ? result.note
        : null,
      processed_at: new Date().toISOString(),
    });
  } catch {
    // best effort
  }
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

  let body: { sessionId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const sessionId = body.sessionId;
  if (!sessionId) return json({ error: "session_id_required" }, 400);

  const { data: session, error: sessionErr } = await svc
    .from("checkout_sessions")
    .select("id, user_id, merchant_trade_no, amount, status, expires_at, order_id, reject_reason")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessionErr) {
    console.error("checkout_sessions lookup failed:", sessionErr.message);
    return json({ error: "confirm_failed" }, 500);
  }
  if (!session) return json({ error: "session_not_found" }, 404);

  const snapshot = (overrides: Record<string, unknown> = {}) =>
    json({
      sessionId: session.id,
      status: session.status,
      orderId: session.order_id,
      rejectReason: session.reject_reason,
      expiresAt: session.expires_at,
      ...overrides,
    });

  if (session.status !== "open") return snapshot();
  if (ecpayConfigError()) return snapshot({ note: "confirm_unavailable" });

  const result = await verifyAndFulfillEcpaySession(svc, session);
  await recordConfirmEvent(svc, session, result);

  switch (result.kind) {
    case "fulfilled":
      return snapshot({ status: "fulfilled", orderId: result.orderId });
    case "rejected":
      return snapshot({ status: "rejected", rejectReason: result.reason });
    case "not_paid":
      return snapshot({ note: "not_paid" });
    case "mismatch":
      console.error("confirm-checkout-session verification mismatch:", session.id, result.note);
      return snapshot({ note: "verification_failed" });
    case "unavailable":
      return snapshot({ note: "confirm_unavailable" });
  }
});
