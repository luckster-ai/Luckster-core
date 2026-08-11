// Transient storage for learner-built Practices (Practice Builder → Save).
//
// This is NOT a Learner Data persistence layer. It exists only to bridge
// Save -> Practice Detail -> Practice Player within a single browser tab
// session, reusing the existing PracticePage / PracticePlayer components
// without writing learner-created content into hand-authored Runtime Data
// (data/practices.js), which is shared content, not per-learner data.
//
// Backed by sessionStorage: it survives a page refresh within the same tab,
// but is cleared when the tab closes and is never synced anywhere. Once a
// real Learner Data layer exists, this module should be replaced, not
// extended.
const STORAGE_KEY = 'joti:custom-practices'

function readAll() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // sessionStorage unavailable (e.g. private browsing) — the built
    // Practice simply won't survive a refresh; Builder composition itself
    // is unaffected.
  }
}

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
