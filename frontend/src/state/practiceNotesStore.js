import { supabase } from '../lib/supabaseClient'

// Practice Notes (Phase 5C). Same thin-wrapper shape as
// practiceActivityStore.js / learningProgressStore.js / moduleUsageStore.js.
// Data layer only -- no UI reads from this yet. A future "public notes
// for this session" or "public notes feed" reader is a trivial addition
// when something actually needs it (RLS already allows it); not added
// here since nothing calls it yet.
export async function createPracticeNote(userId, practiceSessionId, content, visibility = 'private') {
  if (!supabase || !userId) return null

  const { data, error } = await supabase
    .from('practice_notes')
    .insert({ user_id: userId, practice_session_id: practiceSessionId, content, visibility })
    .select('id')
    .single()

  return error ? null : data.id
}

// changes: a partial { content, visibility } -- one function, not two
// near-identical ones, since RLS already allows a member to change
// either (or both) on their own note in the same update.
export async function updatePracticeNote(noteId, changes) {
  if (!supabase || !noteId) return { error: new Error('尚未登入或缺少 note id') }

  return supabase.from('practice_notes').update(changes).eq('id', noteId)
}

export async function deletePracticeNote(noteId) {
  if (!supabase || !noteId) return

  await supabase.from('practice_notes').delete().eq('id', noteId)
}

export async function getOwnPracticeNotes(userId) {
  if (!supabase || !userId) return []

  const { data, error } = await supabase
    .from('practice_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return error || !data ? [] : data
}
