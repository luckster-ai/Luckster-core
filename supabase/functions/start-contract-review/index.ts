// Payment Rebuild -- Step 4: Contract Review & Acceptance Flow.
//
// Idempotent get-or-create for the caller's pending Review Session.
// If the caller has no pending review, this reads "current applicable
// contract version" (contract_versions.is_current) exactly once and pins
// it onto profiles.review_contract_version / review_presented_at. If a
// pending review already exists, it is returned untouched -- a later
// call never re-reads "current" and never overwrites an existing pin.
//
// This function does not decide payment eligibility, membership status,
// or entitlement. It only exposes the pinned Review Session.

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

  const { data, error } = await svc
    .rpc("start_contract_review", { p_user_id: user.id })
    .maybeSingle();

  if (error) {
    if (error.message?.includes("no_current_contract_version")) {
      console.error("start_contract_review: no current contract version configured");
      return json({ error: "no_current_contract_version" }, 503);
    }
    console.error("start_contract_review failed:", error.message);
    return json({ error: "start_review_failed" }, 500);
  }

  return json({
    contractVersion: data?.contract_version ?? null,
    presentedAt: data?.presented_at ?? null,
    reviewAvailableAt: data?.review_available_at ?? null,
    contentIdentifier: data?.content_identifier ?? null,
  });
});
