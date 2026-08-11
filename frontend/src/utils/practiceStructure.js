// Canonical six-block Practice structure, per docs/course-system/practice-library.md
// and docs/course-system/practice-builder.md. Single source of truth for the
// Practice Builder UI and validation layer so the rules can change without
// rewriting components.

export const PRACTICE_TYPES = {
  FULL: 'full',
  MEDITATION: 'meditation'
}

// Section keys follow Builder/state order. Actual playback order additionally
// depends on relaxationPosition (see assemblePracticeOrder in
// validatePracticeBuilder.js), since Relaxation may come before or after
// Meditation per the documented Sequence Rule.
export const SECTIONS = [
  {
    key: 'tuningIn',
    category: 'Tuning In',
    label: '調頻 Tuning In',
    required: true,
    min: 1,
    max: 1,
    appliesTo: [PRACTICE_TYPES.FULL, PRACTICE_TYPES.MEDITATION],
    guidance: '必須 1 部影片，固定位於 Practice 開頭。'
  },
  {
    key: 'warmup',
    category: 'Warm Up',
    label: '暖身 Warm Up',
    required: false,
    min: 0,
    max: 3,
    appliesTo: [PRACTICE_TYPES.FULL, PRACTICE_TYPES.MEDITATION],
    guidance: '可選 1–3 部影片。若所選 Asana（或第一個 Meditation Module）本身已包含熱身功能，可省略。'
  },
  {
    key: 'asana',
    category: 'Asana',
    label: '體式 Asana',
    required: true,
    min: 1,
    max: 1,
    appliesTo: [PRACTICE_TYPES.FULL],
    guidance: '必須恰好 1 部影片。'
  },
  {
    key: 'relaxation',
    category: 'Relaxation',
    label: '放鬆 Relaxation',
    required: false,
    min: 0,
    max: 1,
    appliesTo: [PRACTICE_TYPES.FULL, PRACTICE_TYPES.MEDITATION],
    guidance: '可選 1 部影片，須發生在 Asana 之後；可放在 Meditation 之前或之後。若所選 Module 本身已包含放鬆功能，可省略。'
  },
  {
    key: 'meditation',
    category: 'Meditation',
    label: '冥想 Meditation',
    required: true,
    min: 1,
    max: Infinity,
    appliesTo: [PRACTICE_TYPES.FULL, PRACTICE_TYPES.MEDITATION],
    guidance: '至少 1 部影片，無上限，順序可自由調整。'
  },
  {
    key: 'ending',
    category: 'Ending',
    label: '結尾 Ending',
    required: true,
    min: 1,
    max: 1,
    appliesTo: [PRACTICE_TYPES.FULL, PRACTICE_TYPES.MEDITATION],
    guidance: '必須 1 部影片，固定位於 Practice 結尾。'
  }
]

export function sectionsForPracticeType(practiceType) {
  return SECTIONS.filter((section) => section.appliesTo.includes(practiceType))
}

export function getSection(key) {
  return SECTIONS.find((section) => section.key === key) || null
}
