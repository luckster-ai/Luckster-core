// Official Practice Architecture — Phase 1.
//
// Shape is intentionally the same as a saved Custom Practice
// (state/customPracticeStore.js) minus `isCustom` -- there is one
// Practice shape, not two. Required fields: id, slug, title,
// chineseTitle, difficulty, description, modules (playback-ordered
// Module slugs). Optional, additive fields (safe to omit -- see the
// helpers/fallbacks each one has):
//   - builderSections: { tuningIn: [id], warmup: [id], ... } -- the
//     exact Section composition, Module IDs (same shape the Builder's
//     Save flow already writes for Custom Practices). Lets this Practice
//     be reopened in the Builder for editing with no ambiguity, and lets
//     validate-official-practices.mjs check `modules` order against it.
//     Without it, editing/order-checking fall back to inferring Section
//     placement from each Module's own `type` field (see
//     buildBuilderStateFromPractice in utils/validatePracticeBuilder.js)
//     -- correct for single-category Modules (true of every Module used
//     by P001 today), but with a known fidelity gap for multi-category
//     ones, so builderSections is the preferred path once authoring a
//     new Practice through the Builder (see docs on that flow).
//   - relaxationPosition: 'before' | 'after' -- paired with
//     builderSections; meaningless without it.
//   - status: 'draft' | 'published' -- absent means published (see
//     utils/practiceLifecycle.js). A `draft` Practice can sit in this
//     file, incomplete or unvalidated, without appearing in the Practice
//     Hub or Home's featured slot.
// See frontend/scripts/validate-official-practices.mjs to check any
// entry here against the same Section rules the Builder enforces
// interactively, plus Module-existence and Bunny-readiness.
const practices = [
  {
    id: 'P001',
    slug: 'practice01-surya-kirtan18',
    title: 'Surya Kriya & Kirtan Kriya Practice',
    chineseTitle: '太陽奎亞與克爾坦奎亞練習',
    difficulty: 'Beginner',
    duration: 0,
    description:
      '一堂完整的 Kundalini Yoga Practice，包含調頻、暖身、身體奎亞、放鬆、冥想與結尾。',
    modules: [
      'tuning01-standard',
      'warmup01-surya-namaskar',
      'asana01-surya-kriya',
      'relax01-savasana-guided',
      'med01-kirtan-kriya-18min',
      'end01-long-time-sun-en'
    ]
  }
]

export default practices