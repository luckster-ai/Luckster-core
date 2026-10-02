// Payment Rebuild -- Step 5: Payment Core.
//
// Creates an Order after independently re-validating the Contract
// Acceptance Gate and looking up the server-side price for the requested
// plan. Amount is always server-side (never trusts a client-supplied
// value).
//
// Contract Acceptance Gate scope (deliberately minimal, per Step 5
// authorization): this only checks "does the caller have an existing
// contract_acceptances row at all". It does NOT check whether a newer
// contract_versions.requires_reacceptance = true version has since been
// published -- whether that should block new Orders is an undecided
// product rule and is Step 8's concern, not something to invent here.
//
// Payment Rebuild -- Step 6: after the Order row exists, delegates to the
// active Provider Adapter's startCheckout() to actually start a payment
// attempt. This function imports exactly one Adapter (oenAdapter, from
// ../_shared/oenAdapter.ts) -- that single import is the only place this
// file knows "Oen" exists; everything else below (pricing, the Contract
// Acceptance Gate, the Order insert) is unchanged from Step 5 and remains
// provider-independent. Swapping to a different Provider later means
// changing this one import, not this file's other logic.

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";
import { OEN_PROVIDER_NAME, oenAdapter } from "../_shared/oenAdapter.ts";
import type { StartCheckoutResult } from "../_shared/paymentProviderAdapter.ts";

// payment-legal-spec.md §2 -- server-side price table. Never trust a
// client-supplied amount.
const PLAN_PRICING: Record<string, { amount: number; currency: string }> = {
  monthly: { amount: 333, currency: "TWD" },
  annual: { amount: 3333, currency: "TWD" },
};

// order-schema-proposal.md Decision 8: payment_expires_at = created_at + 3
// days, computed by trusted server-side logic at Order creation, not a DB
// column default.
const PAYMENT_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

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

  let body: { planCode?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const planCode = body.planCode;
  const pricing = planCode ? PLAN_PRICING[planCode] : undefined;
  if (!pricing || !planCode) {
    return json({ error: "invalid_plan_code" }, 400);
  }

  // Contract Acceptance Gate: existence-only check (see file header).
  const { data: acceptance, error: acceptanceErr } = await svc
    .from("contract_acceptances")
    .select("id, contract_version")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (acceptanceErr) {
    console.error("contract_acceptances lookup failed:", acceptanceErr.message);
    return json({ error: "order_create_failed" }, 500);
  }
  if (!acceptance) {
    return json({ error: "no_contract_acceptance" }, 409);
  }

  const paymentExpiresAt = new Date(Date.now() + PAYMENT_WINDOW_MS);

  const { data: order, error: insertErr } = await svc
    .from("orders")
    .insert({
      user_id: user.id,
      contract_acceptance_id: acceptance.id,
      contract_version: acceptance.contract_version,
      plan_code: planCode,
      amount: pricing.amount,
      currency: pricing.currency,
      status: "pending_payment",
      payment_attempt: 1,
      payment_expires_at: paymentExpiresAt.toISOString(),
      // provider is deliberately left unset (NULL) -- Payment Core does
      // not know or decide which provider will process this Order; a
      // Provider Adapter (Step 6+) sets it when it actually starts a
      // checkout attempt.
    })
    .select("id, status, payment_attempt, payment_expires_at")
    .single();

  if (insertErr || !order) {
    console.error("order insert failed:", insertErr?.message);
    return json({ error: "order_create_failed" }, 500);
  }

  // Order exists at this point regardless of what happens below -- a
  // Provider start-checkout failure does not roll back the Order. It stays
  // pending_payment with provider still NULL; retry-order-payment (or a
  // future "resume checkout" call) can attempt a Provider checkout again
  // without creating a second Order.
  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  let checkout: StartCheckoutResult;
  try {
    checkout = await oenAdapter.startCheckout({
      orderId: order.id,
      paymentAttempt: order.payment_attempt,
      amount: pricing.amount,
      currency: pricing.currency,
      planCode,
      successUrl: `${siteUrl}/checkout/return?order=${order.id}&result=success`,
      failureUrl: `${siteUrl}/checkout/return?order=${order.id}&result=failed`,
    });
  } catch (e) {
    console.error("provider startCheckout failed:", (e as Error).message);
    return json({
      error: "checkout_start_failed",
      orderId: order.id,
      status: order.status,
      paymentAttempt: order.payment_attempt,
      paymentExpiresAt: order.payment_expires_at,
    }, 502);
  }

  const { error: updateErr } = await svc
    .from("orders")
    .update({
      provider: OEN_PROVIDER_NAME,
      provider_checkout_ref: checkout.providerCheckoutRef,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (updateErr) {
    console.error("order provider update failed:", updateErr.message);
    return json({
      error: "checkout_start_failed",
      orderId: order.id,
      status: order.status,
      paymentAttempt: order.payment_attempt,
      paymentExpiresAt: order.payment_expires_at,
    }, 502);
  }

  return json({
    orderId: order.id,
    status: order.status,
    paymentAttempt: order.payment_attempt,
    paymentExpiresAt: order.payment_expires_at,
    redirectUrl: checkout.redirectUrl,
  });
});
