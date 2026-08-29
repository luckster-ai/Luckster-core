import { supabase } from '../lib/supabaseClient'

// Trial / Module Usage Tracking (Phase 4D). Thin wrapper around the
// Phase 4B RPC, same shape as learningProgressStore.js's functions --
// no userId parameter, since record_module_usage() reads auth.uid()
// from the caller's own session server-side (see
// supabase/schema_module_usage.sql). Never throws: a dropped heartbeat
// just means slightly less usage gets credited, which favors the
// member (per the Phase 4A "when uncertain, favor the member"
// principle) rather than something a caller needs to react to.
export async function recordModuleUsage(moduleId, elapsedSeconds) {
  if (!supabase) return

  try {
    await supabase.rpc('record_module_usage', {
      p_module_id: moduleId,
      p_elapsed_seconds: elapsedSeconds
    })
  } catch {
    // Best-effort heartbeat -- see comment above.
  }
}
