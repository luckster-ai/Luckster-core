// Payment Phase 1 -- Oen TEST first-subscription MVP.
//
// Frontend (logged-in user) -> this function -> Oen TEST /checkout-subscription
//   -> returns the Oen hosted-checkout redirect URL.
//
// Guards:
//   - verify_jwt = true (config.toml): Supabase rejects unauthenticated
//     callers before this handler runs. We still decode the JWT to get the
//     user id.
//   - OEN_MODE must be "test" and oenConfigError() must pass, or 503.
//   - Server-side allowlist OEN_TEST_ALLOWED_USER_IDS (A3): even if the
//     Preview-only /subscribe page leaks, only listed user ids can start a
//     checkout.
//   - Amount comes from OEN_TEST_PLAN_AMOUNT (server), never from the
//     request body (A12).
//   - The pending subscription_checkouts row is written BEFORE calling Oen
//     (A1); it is the only user-identity source the webhook trusts.

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";
import {
  checkoutRedirectUrl,
  createSubscriptionCheckout,
  OEN_MODE,
  oenConfigError,
} from "../_shared/oen.ts";

const PLAN_ID = "joti_monthly_test";
const PLAN_NAME = "JOTI 訂閱（測試）";

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

  // Hard stop: this MVP function never runs against Oen production.
  if (OEN_MODE !== "test") return json({ error: "not_test_mode" }, 503);
  const cfgErr = oenConfigError();
  if (cfgErr) {
    console.error("oen config error:", cfgErr);
    return json({ error: "misconfigured" }, 503);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) return json({ error: "unauthorized" }, 401);

  const svc = serviceClient();
  const { data: userData, error: userErr } = await svc.auth.getUser(jwt);
  const user = userData?.user;
  if (userErr || !user) return json({ error: "unauthorized" }, 401);

  // A3: server-side allowlist for the TEST phase.
  const allow = (Deno.env.get("OEN_TEST_ALLOWED_USER_IDS") ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (!allow.includes(user.id)) {
    return json({ error: "not_allowed_in_test" }, 403);
  }

  const amount = Number(Deno.env.get("OEN_TEST_PLAN_AMOUNT") ?? "0");
  if (!Number.isInteger(amount) || amount <= 100) {
    console.error("OEN_TEST_PLAN_AMOUNT invalid (must be integer > 100):", amount);
    return json({ error: "plan_amount_invalid" }, 503);
  }

  const siteUrl = (Deno.env.get("SITE_URL") ?? "").replace(/\/+$/, "");
  if (!siteUrl) return json({ error: "site_url_missing" }, 503);

  const orderId = `joti-${crypto.randomUUID()}`;

  // A1: write the pending intent first. If this fails, do NOT call Oen.
  const { error: insErr } = await svc.from("subscription_checkouts").insert({
    user_id: user.id,
    order_id: orderId,
    plan_id: PLAN_ID,
    amount,
    mode: "test",
    status: "pending",
  });
  if (insErr) {
    console.error("pending checkout insert failed:", insErr.message);
    return json({ error: "checkout_init_failed" }, 500);
  }

  let oen;
  try {
    oen = await createSubscriptionCheckout({
      amount,
      orderId,
      successUrl: `${siteUrl}/account?checkout=success`,
      failureUrl: `${siteUrl}/account?checkout=failed`,
      planId: PLAN_ID,
      planName: PLAN_NAME,
      userId: user.id,
    });
  } catch (e) {
    await svc.from("subscription_checkouts")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("order_id", orderId);
    console.error("oen /checkout-subscription threw:", (e as Error).message);
    return json({ error: "oen_unreachable" }, 502);
  }

  if (!oen.ok || !oen.json || oen.json.code !== "S0000" || !oen.json.data?.id) {
    await svc.from("subscription_checkouts")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("order_id", orderId);
    console.error(
      "oen /checkout-subscription failed:",
      oen.status,
      oen.json?.code ?? "(no code)",
      oen.raw.slice(0, 300),
    );
    return json({ error: "oen_checkout_failed", code: oen.json?.code ?? null }, 502);
  }

  await svc.from("subscription_checkouts").update({
    oen_checkout_id: oen.json.data.id,
    oen_transaction_hid: oen.json.data.transactionHid ?? null,
    updated_at: new Date().toISOString(),
  }).eq("order_id", orderId);

  // Response carries ONLY the redirect URL -- no Oen internals, no secrets.
  return json({ checkoutUrl: checkoutRedirectUrl(oen.json.data.id) });
});
