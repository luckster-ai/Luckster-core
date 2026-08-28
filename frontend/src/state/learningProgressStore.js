import { supabase } from '../lib/supabaseClient'

// Learning Data (Phase 3). Mirrors the shape utils/learnerStatus.js
// already expects (`{[assetId]: status}`) -- reduced straight from the
// query result, no transformation logic beyond that. Returns an empty
// map (never throws) whenever Supabase isn't configured or the user
// isn't logged in, so every caller can treat "no data yet" the same way
// getLearnerStatus already does (falls back to NOT_STARTED).
export async function getLearnerStatusMap(userId) {
  if (!supabase || !userId) return {}

  const { data, error } = await supabase
    .from('learning_progress')
    .select('asset_id, status')
    .eq('user_id', userId)

  if (error || !data) return {}

  return Object.fromEntries(data.map((row) => [row.asset_id, row.status]))
}

// Upserts by (user_id, asset_type, asset_id) -- calling this again for
// something already marked complete just refreshes completed_at, never
// creates a duplicate row (matches the table's own unique constraint).
export async function markLearningCompleted(userId, assetType, assetId) {
  if (!supabase || !userId) return { error: new Error('尚未登入') }

  return supabase.from('learning_progress').upsert(
    {
      user_id: userId,
      asset_type: assetType,
      asset_id: assetId,
      status: 'completed',
      completed_at: new Date().toISOString()
    },
    { onConflict: 'user_id,asset_type,asset_id' }
  )
}
