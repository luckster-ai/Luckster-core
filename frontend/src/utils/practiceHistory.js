import modules from '../data/modules'
import { getCustomPractice } from '../state/customPracticeStore'

// Practice History (Phase 5D). practice_sessions.practice_id is a stable
// identity (P00x for Official, a slug for Custom -- see the Phase 5A ADR
// on asset identity), never the routing slug directly for Official
// Practices, so this has to resolve it before History can link anywhere.
//
// Phase 6D: Official Practices live solely in Supabase, so their
// titles/links come in via `officialById` (a Map keyed by practice id,
// built once by usePracticeHistory). React/Supabase stay out of this
// file -- the caller owns the fetch.
//
// Returns null (not a placeholder object) when the Practice can't be
// resolved at all -- a Custom Practice that only ever existed on another
// device, an archived/removed Official Practice, or Supabase being
// unreachable. The caller then falls back to resolveModuleTitles(), which
// works from practice_sessions.module_ids alone.
export function resolvePracticeById(practiceId, officialById = null) {
  const official = officialById && officialById.get(practiceId)
  if (official) return { chineseTitle: official.chineseTitle, slug: official.slug }

  // Custom Practices use their own slug as their id (see
  // state/customPracticeStore.js), so the same id looks itself up here.
  const custom = getCustomPractice(practiceId)
  if (custom) return { chineseTitle: custom.chineseTitle, slug: custom.slug }

  return null
}

// The graceful-degradation path above: module_ids is a Phase 5B
// snapshot, always present and always accurate for what was actually
// practiced, independent of whether the Practice itself can still be
// found. Unresolvable individual Module ids (same "content can drift"
// caveat as module_usage_events) are silently skipped rather than
// shown as broken entries.
export function resolveModuleTitles(moduleIds) {
  return moduleIds
    .map((moduleId) => modules.find((module) => module.id === moduleId))
    .filter(Boolean)
    .map((module) => module.chineseTitle)
}

// Local-timezone day grouping: new Date(...).toLocaleDateString() uses
// the browser's own timezone by default (no timeZone option passed),
// which is exactly the "member's local day" behavior History needs --
// no separate timezone-conversion logic required. Assumes sessions is
// already sorted newest-first (getOwnPracticeSessions() orders by
// started_at descending), so day keys naturally come out in that same
// order; Map preserves insertion order, so no re-sort is needed here.
export function groupSessionsByDay(sessions) {
  const groups = new Map()

  for (const session of sessions) {
    const day = new Date(session.started_at).toLocaleDateString('zh-TW')

    if (!groups.has(day)) groups.set(day, [])
    groups.get(day).push(session)
  }

  return Array.from(groups.entries()).map(([day, daySessions]) => ({ day, sessions: daySessions }))
}
