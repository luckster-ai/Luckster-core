// Payment Rebuild -- Step 4: Contract Review & Acceptance Flow.
//
// Existing-member re-acceptance flow (requires_reacceptance = true on the
// current contract version). Deliberately separate from
// agree-to-contract: no 3-day wait, and does not read or write
// profiles.review_contract_version / review_presented_at -- those columns
// represent the pre-payment 3-day Review Session only, a legally distinct
// flow from reacceptance (payment-legal-spec.md §8 does not require a new
// 3-day period here).
//
// Step 4 only provides this capability. WHICH members need to reaccept,
// WHEN they are shown this flow, and what happens to their access in the
// meantime are Step 8 (Membership/Entitlement) decisions -- not
// implemented here.

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

  const { data: acceptanceId, error } = await svc.rpc("reaccept_contract", {
    p_user_id: user.id,
  });

  if (error) {
    if (error.message?.includes("no_reacceptance_required")) {
      return json({ error: "no_reacceptance_required" }, 409);
    }
    if (error.message?.includes("already_accepted")) {
      return json({ error: "already_accepted" }, 409);
    }
    console.error("reaccept_contract failed:", error.message);
    return json({ error: "reaccept_failed" }, 500);
  }

  return json({ acceptanceId });
});
