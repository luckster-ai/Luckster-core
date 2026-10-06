// Payment Rebuild -- Step 10: Plan Change -- Immediate Change only
// (Monthly -> Annual; no other transition supports Immediate per the
// confirmed rules -- Annual -> Monthly uses the generic §11 early
// termination + a separate, ordinary purchase, which needs no new code at
// all).
//
// This is a thin server-side coordinator, not a reimplementation: it
// calls the two ALREADY-BUILT, ALREADY-TESTED Edge Functions in sequence
// over HTTP (not by importing their internals) -- terminate-service-period
// (Step 9) to end the member's current Monthly period and record its
// refund, then create-order-checkout (Step 5/6, extended in Step 10) to
// purchase the new Annual plan. Each call is independently authoritative;
// this function does not retry either step or wrap them in a shared
// transaction -- Immediate Change's own confirmed rule is that the refund
// and the new purchase are independent transactions, not one atomic unit.
//
// By the time step 2 runs, the member's old period has already been
// terminated (step 1 succeeded), so create-order-checkout's Plan Change
// eligibility gate finds no active period and takes its completely
// ordinary path (scheduled_service_start stays NULL, ordinary now()
// start) -- this file does not pass or need any Plan-Change-specific
// flag to that call.

import { corsHeaders } from "../_shared/cors.ts";
import { serviceClient } from "../_shared/db.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const FUNCTIONS_BASE = (Deno.env.get("SUPABASE_URL") ?? "").replace(/\/+$/, "") + "/functions/v1";

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

  let body: { newPlanCode?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const newPlanCode = body.newPlanCode;
  if (newPlanCode !== "annual") {
    // Immediate Change only exists for Monthly -> Annual -- anything else
    // (including Annual -> Monthly) is rejected here rather than guessed
    // at; the caller should use the generic early-termination path
    // (terminate-service-period) followed by an ordinary purchase instead.
    return json({ error: "immediate_change_not_available_for_this_plan" }, 400);
  }

  // Find the member's currently-active Service Period -- same double-bound
  // check Step 8's entitlement formula and create-order-checkout's
  // eligibility gate both use, not a different definition of "active".
  const { data: candidatePeriods, error: periodsErr } = await svc
    .from("service_periods")
    .select("id, plan_code, service_period_start, service_period_end")
    .eq("user_id", user.id)
    .is("terminated_at", null)
    .gt("service_period_end", new Date().toISOString());

  if (periodsErr) {
    console.error("service_periods lookup failed:", periodsErr.message);
    return json({ error: "plan_change_failed" }, 500);
  }

  const nowMs = Date.now();
  const activePeriod = (candidatePeriods ?? []).find(
    (p) =>
      nowMs >= new Date(p.service_period_start).getTime() &&
      nowMs < new Date(p.service_period_end).getTime(),
  );

  if (!activePeriod) {
    return json({ error: "no_active_service_period" }, 409);
  }
  if (activePeriod.plan_code !== "monthly") {
    // Already Annual -> Annual, or any other starting plan, does not
    // support Immediate Change per the confirmed rules.
    return json({ error: "immediate_change_not_available_for_this_plan" }, 400);
  }

  // Step 1: terminate the old period via Step 9's existing, already-tested
  // Edge Function. Forwards the caller's own JWT -- this call is made as
  // the member, not with any elevated privilege.
  const termRes = await fetch(`${FUNCTIONS_BASE}/terminate-service-period`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ servicePeriodId: activePeriod.id }),
  });
  let termJson: unknown;
  try {
    termJson = await termRes.json();
  } catch {
    termJson = null;
  }
  if (!termRes.ok) {
    console.error("terminate-service-period failed during Immediate Change:", termRes.status, termJson);
    return json({ error: "termination_failed", detail: termJson }, 502);
  }

  // Step 2: purchase the new plan via the existing, now Step-10-extended
  // create-order-checkout. No afterExpiry flag -- the old period is
  // already terminated, so this is an entirely ordinary purchase.
  const checkoutRes = await fetch(`${FUNCTIONS_BASE}/create-order-checkout`, {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "application/json" },
    body: JSON.stringify({ planCode: "annual" }),
  });
  let checkoutJson: Record<string, unknown> | null = null;
  try {
    checkoutJson = await checkoutRes.json();
  } catch {
    checkoutJson = null;
  }
  if (!checkoutRes.ok) {
    console.error("create-order-checkout failed during Immediate Change:", checkoutRes.status, checkoutJson);
    // The old period IS already terminated at this point -- surfaced
    // explicitly so the caller does not assume nothing happened.
    return json({ error: "new_plan_checkout_failed", detail: checkoutJson, oldPeriodTerminated: true }, 502);
  }

  return json(checkoutJson);
});
