// Payment Rebuild -- Step 4: Contract Review & Acceptance Flow.
//
// Initial, payment-pre Agree flow. Server-side re-validates everything
// independently of the client -- the request body carries NO version,
// timestamp, or eligibility fields at all, by design (A9/Step 4 Final
// Implementation Plan §十一): the only input is "who is calling", and
// agree_to_contract() derives version / presented_at / 3-day eligibility
// entirely from the caller's own pinned profiles row, atomically.
//
// This function does not touch Order creation (Step 5) or any
// Membership/Entitlement decision (Step 8).

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

  const { data: acceptanceId, error } = await svc.rpc("agree_to_contract", {
    p_user_id: user.id,
  });

  if (error) {
    if (error.message?.includes("no_eligible_pending_review")) {
      // Either no pending review exists, or the 3-day minimum has not
      // yet elapsed. Deliberately not distinguished in the response --
      // the client already knows its own review_available_at from
      // start-contract-review for display purposes; this endpoint just
      // refuses if the server-side guard does not independently agree.
      return json({ error: "no_eligible_pending_review" }, 409);
    }
    console.error("agree_to_contract failed:", error.message);
    return json({ error: "agree_failed" }, 500);
  }

  return json({ acceptanceId });
});
