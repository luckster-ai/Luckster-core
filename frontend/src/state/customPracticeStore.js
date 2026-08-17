// Local-device storage for learner-built Practices (Practice Builder →
// Save), keyed by slug.
//
// This is NOT a synced Learner Data / accounts system -- it is
// single-device, browser-local storage. It exists to bridge Save ->
// Practice Detail -> Practice Player -> re-open -> edit -> Save-again
// (Sprint 1E), reusing the existing PracticePage / PracticePlayer /
// PracticeBuilder components without writing learner-created content
// into hand-authored Runtime Data (data/practices.js), which is shared
// content, not per-learner data.
//
// Backed by localStorage (Sprint 1E; was sessionStorage through Sprint
// 1D): saveCustomPractice already overwrites by slug, so calling it
// again with the same slug (see PracticeBuilder.jsx's edit-mode Save)
// is already an update-in-place, not a duplicate. Switching to
// localStorage is what makes "leave the Builder, come back later, edit
// it" actually survive a closed tab/browser restart on this device --
// sessionStorage never could. Still local-only, no cross-device sync.
// Once a real Learner Data layer exists, this module should be
// replaced, not extended.
const STORAGE_KEY = 'joti:custom-practices'

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // localStorage unavailable (e.g. private browsing) — the built
    // Practice simply won't persist; Builder composition itself is
    // unaffected.
  }
}

// Overwrites by slug — calling this again with a slug that already
// exists (see PracticeBuilder.jsx's edit-mode Save) updates that
// Practice in place rather than creating a duplicate.
export function saveCustomPractice(practice) {
  const all = readAll()
  all[practice.slug] = practice
  writeAll(all)
}

export function getCustomPractice(slug) {
  const all = readAll()
  return all[slug] || null
}

export function generateCustomPracticeSlug() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
