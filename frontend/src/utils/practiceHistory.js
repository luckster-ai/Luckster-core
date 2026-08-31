import practices from '../data/practices'
import modules from '../data/modules'
import { getCustomPractice } from '../state/customPracticeStore'

// Practice History (Phase 5D). Pure functions, no Supabase/React
// involved -- practice_sessions.practice_id is a stable identity (P001
// for Official, a slug for Custom -- see the Phase 5A ADR on asset
// identity), never the routing slug directly for Official Practices, so
// this has to resolve it before History can link anywhere.
//
// Returns null (not a placeholder object) when the Practice can't be
// found at all -- either a Custom Practice that only ever existed in a
// different browser/device's localStorage, or (same code path, no
// special-casing needed) a hypothetical future Official Practice that
// got removed from data/practices.js after someone practiced it. Either
// way, the caller falls back to resolveModuleTitles() below, which
// works from practice_sessions.module_ids alone and needs nothing this
// function could fail to find.
export function resolvePracticeById(practiceId) {
  const official = practices.find((practice) => practice.id === practiceId)
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
