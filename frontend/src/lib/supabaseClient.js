import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Membership / Authentication Foundation (Phase 2A). These env vars
// don't exist yet in any environment until a Supabase project is
// created and VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY are set (see
// frontend/.env.example and supabase/schema.sql). Exporting null instead
// of throwing lets the rest of the site keep working before that setup
// happens -- AuthContext treats a null client as "no session, ever"
// rather than crashing the whole app.
export const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null
