// CORS headers for the browser-invoked function (create-subscription-checkout).
// Auth is carried in the Authorization header (a Supabase JWT), not cookies,
// so a permissive origin is acceptable here. oen-webhook is server-to-server
// and does not use this.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
