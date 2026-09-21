// Payment Rebuild -- Step 5: Payment Core.
//
// Retries payment for an existing Order still within its 3-day payment
// window (order-schema-proposal.md Decision A). Only performs the
// Core-owned state transition (payment_failed -> pending_payment,
// payment_attempt + 1) via retry_order_payment(); this function does not
// call any Payment Provider Adapter. Step 6 will extend it to also
// delegate to the Adapter's startCheckout() for the new attempt (see
// ../_shared/paymentProviderAdapter.ts).

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";

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
    .select("id")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ownerErr || !order) {
    return json({ error: "order_not_found" }, 404);
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

  // STEP 6 TODO: delegate to PaymentProviderAdapter.startCheckout() here
  // with the new payment_attempt and merge its result into this response.
  return json({ orderId, status: "pending_payment", paymentAttempt: newAttempt });
});
