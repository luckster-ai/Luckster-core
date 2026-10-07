// Payment Rebuild -- Step 5: Payment Core.
//
// Retries payment for an existing Order still within its 3-day payment
// window (order-schema-proposal.md Decision A). Performs the Core-owned
// state transition (payment_failed -> pending_payment, payment_attempt + 1)
// via retry_order_payment(), then (Step 6) delegates to the active Provider
// Adapter's startCheckout() for the new attempt -- same single-import
// pattern as create-order-checkout/index.ts, see that file's header.
//
// ECPay integration: an Order retries with the provider already recorded
// on it (orders.provider), falling back to ACTIVE_PAYMENT_PROVIDER only if
// no attempt ever reached a provider -- a retry never silently switches an
// Order to a different provider.

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";
import { activeProviderName, getProviderAdapter } from "../_shared/paymentProviders.ts";
import type { StartCheckoutResult } from "../_shared/paymentProviderAdapter.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const orderId = body.orderId;
  if (!orderId) return json({ error: "order_id_required" }, 400);

  // Ownership check before attempting the retry -- retry_order_payment()
  // runs as service_role and does not itself check auth.uid().
  const { data: order, error: ownerErr } = await svc
    .from("orders")
    .select("id, amount, currency, plan_code, provider")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownerErr || !order) {
    return json({ error: "order_not_found" }, 404);
  }

  const providerName: string = order.provider ?? activeProviderName();
  const adapter = getProviderAdapter(providerName);
  if (!adapter) {
    console.error("unknown provider for retry:", providerName);
    return json({ error: "retry_failed" }, 500);
  }

  const { data: newAttempt, error } = await svc.rpc("retry_order_payment", {
    p_order_id: orderId,
  });

  if (error) {
    if (error.message?.includes("order_not_eligible_for_retry")) {
      return json({ error: "order_not_eligible_for_retry" }, 409);
    }
    console.error("retry_order_payment failed:", error.message);
    return json({ error: "retry_failed" }, 500);
  }

  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  let checkout: StartCheckoutResult;
  try {
    checkout = await adapter.startCheckout({
      orderId: order.id,
      paymentAttempt: newAttempt,
      amount: order.amount,
      currency: order.currency,
      planCode: order.plan_code,
      successUrl: `${siteUrl}/checkout/return?order=${order.id}&result=success`,
      failureUrl: `${siteUrl}/checkout/return?order=${order.id}&result=failed`,
    });
  } catch (e) {
    console.error("provider startCheckout failed (retry):", (e as Error).message);
    return json({ error: "checkout_start_failed", orderId, paymentAttempt: newAttempt }, 502);
  }

  const { error: updateErr } = await svc
    .from("orders")
    .update({
      provider: providerName,
      provider_checkout_ref: checkout.providerCheckoutRef,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateErr) {
    console.error("order provider update failed (retry):", updateErr.message);
    return json({ error: "checkout_start_failed", orderId, paymentAttempt: newAttempt }, 502);
  }

  return json({
    orderId,
    status: "pending_payment",
    paymentAttempt: newAttempt,
    redirectUrl: checkout.redirectUrl,
    formPost: checkout.formPost,
  });
});
