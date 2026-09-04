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

// Practice Resume (Phase 5E). The still-open session for this user +
// Practice the viewer was most recently *active* in, or null. Ordered by
// progress_updated_at (last activity) -- not started_at -- so "resume my
// last practice" picks the one actually being watched, even when older
// unfinished rows exist (e.g. after a 重新開始 or a >12h fresh start).
// started_at is only a tiebreaker for rows that never produced progress.
// Only ever one is resumed at a time (LIMIT 1); the others are left
// alone. On any failure this returns null -- the caller then just starts
// a fresh attempt, same graceful degradation as everywhere else here.
export async function getResumableSession(userId, practiceId) {
  if (!supabase || !userId || !practiceId) return null

  const { data, error } = await supabase
    .from('practice_sessions')
    .select('id, module_ids, progress_module_index, progress_position_seconds, progress_updated_at')
    .eq('user_id', userId)
    .eq('practice_id', practiceId)
    .is('completed_at', null)
    .order('progress_updated_at', { ascending: false, nullsFirst: false })
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return error || !data ? null : data
}

// Practice Resume (Phase 5E). Fire-and-forget, same shape as
// completePracticeSession -- save_practice_session_progress() reads
// auth.uid() itself and only writes an own, not-yet-finished session's
// three progress columns (see supabase/schema_practice_resume.sql).
export async function savePracticeSessionProgress(sessionId, moduleIndex, positionSeconds) {
  if (!supabase || !sessionId) return

  await supabase.rpc('save_practice_session_progress', {
    p_session_id: sessionId,
    p_module_index: moduleIndex,
    p_position_seconds: Math.max(0, Number(positionSeconds) || 0)
  })
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
