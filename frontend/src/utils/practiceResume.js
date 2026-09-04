// Practice Resume (Phase 5E). Pure decision function -- no React, no
// Supabase. Given a still-open session row (from getResumableSession) and
// the Practice's CURRENT resolved Module id list, decide whether/how the
// viewer resumes:
//
//   'none'  -- start a fresh Practice from Module 1 (also used for: no
//              session, a session that never produced progress, a Module
//              snapshot that no longer matches, or > 12h since last
//              activity).
//   'auto'  -- <= 1h since last activity: resume silently.
//   'offer' -- > 1h and <= 12h: Practice Detail asks 繼續 / 重新開始.
//
// The time window is measured against progress_updated_at (last real
// activity), never started_at. A null progress_updated_at means the
// session never actually got anywhere -> 'none'.
const ONE_HOUR_MS = 60 * 60 * 1000
const TWELVE_HOURS_MS = 12 * ONE_HOUR_MS

function moduleIdListsEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

export function evaluateResumableSession(session, currentModuleIds, nowMs = Date.now()) {
  if (!session || !session.progress_updated_at) return { mode: 'none' }

  // Practice definition changed since this session started (Custom
  // Practice edited, or an Official Practice's Modules changed): the
  // saved index can no longer be trusted -- start fresh, do not map.
  if (!moduleIdListsEqual(session.module_ids, currentModuleIds)) return { mode: 'none' }

  const moduleIndex = session.progress_module_index
  if (
    !Number.isInteger(moduleIndex) ||
    moduleIndex < 0 ||
    moduleIndex >= currentModuleIds.length
  ) {
    return { mode: 'none' }
  }

  const age = nowMs - Date.parse(session.progress_updated_at)
  if (!Number.isFinite(age) || age < 0 || age > TWELVE_HOURS_MS) return { mode: 'none' }

  return {
    mode: age <= ONE_HOUR_MS ? 'auto' : 'offer',
    sessionId: session.id,
    moduleIndex,
    positionSeconds: Math.max(0, Number(session.progress_position_seconds) || 0)
  }
}
