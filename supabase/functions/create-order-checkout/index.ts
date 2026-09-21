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
// Deliberately does NOT call any Payment Provider Adapter and does NOT
// return a checkout URL -- Step 5 stops at orders.status='pending_payment'.
// The Provider Adapter boundary this function will delegate to in Step 6
// is defined (type-only, no implementation) in
// ../_shared/paymentProviderAdapter.ts.

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";

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

  // STEP 6 TODO: once the Oen Adapter exists, delegate here to
  // PaymentProviderAdapter.startCheckout() (see
  // ../_shared/paymentProviderAdapter.ts) and merge its
  // { providerCheckoutRef, redirectUrl } into this response and into
  // orders.provider_checkout_ref. Step 5 deliberately stops here -- no
  // checkout URL yet.
  return json({
    orderId: order.id,
    status: order.status,
    paymentAttempt: order.payment_attempt,
    paymentExpiresAt: order.payment_expires_at,
  });
});
