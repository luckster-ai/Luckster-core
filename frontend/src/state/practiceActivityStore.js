import { supabase } from '../lib/supabaseClient'

// Practice Activity (Phase 5B). Same thin-wrapper shape as
// learningProgressStore.js / moduleUsageStore.js. No userId parameter on
// completePracticeSession -- complete_practice_session() reads auth.uid()
// from the caller's own session server-side (see
// supabase/schema_practice_activity.sql), same reasoning as
// record_module_usage().
//
// Returns null/no-op whenever Supabase isn't configured or the caller
// isn't logged in -- a logged-out visitor practicing a Practice
// (PracticePlayer has no route guard) simply produces no history, same
// as Phase 3/4's hooks already do.
export async function startPracticeSession(userId, practiceId, moduleIds) {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('practice_sessions')
    .insert({ user_id: userId, practice_id: practiceId, module_ids: moduleIds })
    .select('id')
    .single()

  return error ? null : data.id
}

export async function completePracticeSession(sessionId) {
  if (!supabase || !sessionId) return

  await supabase.rpc('complete_practice_session', { p_session_id: sessionId })
}

// Phase 5D: History reads. RLS ("practice_sessions: read own") already
// restricts this to the caller's own rows regardless of the .eq() below
// -- that filter is a query-efficiency choice, not the security
// boundary. No limit/pagination -- current data volume doesn't need it
// yet (see the Phase 5D discovery for why that's deliberately deferred,
// not an oversight).
export async function getOwnPracticeSessions(userId) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })

  return error || !data ? [] : data
}
