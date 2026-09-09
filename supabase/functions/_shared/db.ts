import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// Service-role client -- bypasses RLS. Only ever instantiated inside an
// Edge Function (server-side). SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
// are auto-injected by Supabase into every deployed function; never set
// them yourself, never expose them, never return them in a response.
export function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
