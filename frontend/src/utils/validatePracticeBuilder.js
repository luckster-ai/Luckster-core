import { SECTIONS, sectionsForPracticeType, derivePracticeType, PRACTICE_TYPES } from './practiceStructure.js'

// Builder state shape:
// {
//   relaxationPosition: 'before' | 'after', // relative to Meditation
//   sections: { tuningIn: [moduleId], warmup: [...], asana: [...], relaxation: [...], meditation: [...], ending: [...] }
// }
//
// Practice type is not stored here — it's derived from `sections.asana`
// (see derivePracticeType in practiceStructure.js, Sprint 8.7) so there is
// exactly one source of truth for it and no "unset" state to guard against.
//
// Sections store canonical Module IDs (not slugs), matching ADR 0003's
// identity model: duplicate prevention across Categories is an ID concern.
// The final assembled Practice (assemblePracticeOrder) converts IDs back to
// slugs, matching the existing practices.js `modules: [slug, ...]` shape.

export function createEmptyBuilderState() {
  return {
    relaxationPosition: 'before',
    sections: {
      tuningIn: [],
      warmup: [],
      asana: [],
      relaxation: [],
      meditation: [],
      ending: []
    }
  }
}

function findModuleById(modules, id) {
  return modules.find((item) => item.id === id) || null
}

// Maps a Module's own `type` field to its canonical Section key.
// Used only by buildBuilderStateFromPractice below.
const TYPE_TO_SECTION_KEY = {
  tuning: 'tuningIn',
  warmup: 'warmup',
  asana: 'asana',
  relax: 'relaxation',
  med: 'meditation',
  end: 'ending'
}

// Reconstructs Builder state from an already-saved Practice, for the
// "reopen and edit a saved Practice" flow (Sprint 1E).
//
// Preferred path: practice.builderSections + practice.relaxationPosition,
// an exact copy of Builder state written by PracticeBuilder.jsx's
// handleSave alongside the flat modules list -- every Practice saved
// through the Builder from Sprint 1E onward carries this, so
// reconstruction is exact, with no ambiguity about which Section a
// multi-category Module (e.g. a Warm Up Module also valid for
// Meditation) was actually placed in.
//
// Fallback path: practice.modules (the flat, playback-ordered slug
// list every Practice has, custom or official) mapped back to a
// Section via each Module's own `type` field -- used only when
// builderSections is absent (e.g. an official Practice, which this
// flow never opens for editing, or a Practice saved before this field
// existed). This fallback has a known fidelity gap for multi-category
// Modules: it always restores them into their `type`-implied Section,
// which can misplace one that was actually placed in the other
// Category's Section, and can as a result also mis-infer
// relaxationPosition. Confirmed via Sprint 1E validation testing, not
// just theoretical -- exactly why the exact path above exists.
export function buildBuilderStateFromPractice(practice, modules) {
  const state = createEmptyBuilderState()

  if (practice.builderSections) {
    Object.keys(state.sections).forEach((sectionKey) => {
      state.sections[sectionKey] = [...(practice.builderSections[sectionKey] || [])]
    })

    state.relaxationPosition = practice.relaxationPosition || 'before'

    return state
  }

  // ID first, slug second (Phase 6B) -- see resolvePracticeModules.js's
  // findModuleByRef for why this is unambiguous.
  const resolved = (practice.modules || [])
    .map((ref) => modules.find((module) => module.id === ref || module.slug === ref))
    .filter(Boolean)

  resolved.forEach((module) => {
    const sectionKey = TYPE_TO_SECTION_KEY[module.type]

    if (sectionKey) {
      state.sections[sectionKey].push(module.id)
    }
  })

  // relaxationPosition is a single before/after toggle, not stored
  // directly in the saved Practice -- infer it from whichever of
  // Relaxation/Meditation appears first in the saved playback order.
  const relaxIndex = resolved.findIndex((module) => module.type === 'relax')
  const medIndex = resolved.findIndex((module) => module.type === 'med')

  if (relaxIndex !== -1 && medIndex !== -1 && relaxIndex > medIndex) {
    state.relaxationPosition = 'after'
  }

  return state
}

export function moduleIdsInPractice(state) {
  return Object.values(state.sections).flat()
}

export function isModuleAlreadyInPractice(state, moduleId) {
  return moduleIdsInPractice(state).includes(moduleId)
}

// Per-section status: count vs. min/max, and whether it currently satisfies
// its own quantity rule. Warm Up / Relaxation have no hard capability gate
// here — see the Capability guidance note below.
export function validateSection(sectionKey, state) {
  const section = SECTIONS.find((item) => item.key === sectionKey)
  const ids = state.sections[sectionKey] || []
  const count = ids.length

  const meetsMin = count >= section.min
  const meetsMax = count <= section.max
  const isValid = meetsMin && meetsMax

  return {
    key: section.key,
    label: section.label,
    category: section.category,
    required: section.required,
    min: section.min,
    max: section.max,
    guidance: section.guidance,
    count,
    isValid,
    meetsMin,
    meetsMax
  }
}

// Capability guidance is informational only, never blocking: no Module in the
// current Runtime Data (frontend/src/data/modules.js) has a `capabilities`
// field yet (module-metadata.md documents it as a future field, not
// implemented). Warm Up / Relaxation therefore cannot be *verified* as
// covered by the selected Asana/Meditation Module today, so the Builder
// surfaces the documented condition as guidance rather than asserting it.
export function getCapabilityNote(sectionKey, state, modules) {
  if (sectionKey === 'warmup') {
    const coveringId = state.sections.asana[0] || state.sections.meditation[0]
    const coveringModule = coveringId ? findModuleById(modules, coveringId) : null

    if (coveringModule?.capabilities?.includes('Warm Up')) {
      return `已由「${coveringModule.title}」提供暖身功能，可省略此段落。`
    }

    return null
  }

  if (sectionKey === 'relaxation') {
    if (derivePracticeType(state) === PRACTICE_TYPES.MEDITATION) {
      return '冥想練習可省略放鬆段落（例如時間較短的練習情境），或由所選 Module 本身已包含放鬆功能。'
    }

    const coveringId = state.sections.asana[0]
    const coveringModule = coveringId ? findModuleById(modules, coveringId) : null

    if (coveringModule?.capabilities?.includes('Relaxation')) {
      return `已由「${coveringModule.title}」提供放鬆功能，可省略此段落。`
    }

    return null
  }

  return null
}

// Availability of a single candidate that has ALREADY passed Category
// filtering and same-section exclusion (see ModulePickerCanvas) — those remain
// filtering concerns, not availability states (Sprint 8.6 architecture
// review: "Category vs eligibility"). This only decides the one remaining
// case: a Category-compatible candidate already selected in another
// section. Section-maximum is a separate, section-level concern (the
// picker itself stops rendering once a section is full) and is not part
// of this per-candidate check.
export function getModuleAvailability(moduleId, { disabledIds, moduleSectionLabels }) {
  if (!disabledIds.includes(moduleId)) {
    return { disabled: false, reason: null }
  }

  const sectionLabel = moduleSectionLabels[moduleId]

  return {
    disabled: true,
    reason: sectionLabel ? `已加入「${sectionLabel}」` : '已加入此 Practice'
  }
}

// Groups already-filtered Picker candidates by Subcategory for presentation
// only (Sprint 8.7) — Subcategory is a discovery aid, never an eligibility
// gate; Category filtering (in ModulePickerCanvas, before this runs) remains the
// only mechanism that decides whether a Module is a candidate at all.
// Candidates with no Subcategory are grouped together under a null key
// rather than an invented placeholder value, and rendered without a
// heading. Group order follows first-appearance order in the input array
// (which mirrors modules.js's authored order), avoiding an arbitrary sort.
export function groupModulesBySubcategory(candidates) {
  const groups = []
  const bySubcategory = new Map()

  for (const module of candidates) {
    const key = module.subcategory || null
    let group = bySubcategory.get(key)

    if (!group) {
      group = { subcategory: key, modules: [] }
      bySubcategory.set(key, group)
      groups.push(group)
    }

    group.modules.push(module)
  }

  return groups
}

export function validatePracticeComposition(state) {
  const applicableSections = sectionsForPracticeType(derivePracticeType(state))
  const sectionResults = applicableSections.map((section) =>
    validateSection(section.key, state)
  )

  const errors = sectionResults
    .filter((result) => !result.isValid)
    .map((result) => {
      if (!result.meetsMin) {
        return `${result.label}：至少需要 ${result.min} 部影片（目前 ${result.count} 部）。`
      }

      return `${result.label}：最多 ${result.max} 部影片（目前 ${result.count} 部）。`
    })

  return {
    isStructurallyValid: errors.length === 0,
    sectionResults,
    errors
  }
}

// Pure derived duration helpers (Sprint 8.8) — sum Module `duration`
// (seconds) already present in Runtime Data. Not stored in state; recomputed
// from `state` + `modules` on every render, same pattern as
// validatePracticeComposition/derivePracticeType.
export function getSectionDuration(sectionKey, state, modules) {
  const ids = state.sections[sectionKey] || []

  return ids.reduce((total, id) => {
    const module = findModuleById(modules, id)
    return total + (module ? module.duration : 0)
  }, 0)
}

export function getTotalDuration(state, modules) {
  return Object.keys(state.sections).reduce(
    (total, sectionKey) => total + getSectionDuration(sectionKey, state, modules),
    0
  )
}

// Assembles the final playback-ordered slug list, implementing the
// documented Sequence Rule: Tuning In, Warm Up, Asana, then Relaxation and
// Meditation in either order (learner's choice via relaxationPosition), then
// Ending. Within Warm Up / Meditation, module order is whatever the learner
// arranged via the up/down controls.
// The ID-ordered list itself, before any Module lookup/slug conversion --
// pure state derivation, no `modules` needed. Phase 6C (Admin Official
// Practice) saves this directly as the Supabase `modules` column (Module
// ID array, per Phase 6A/6B); assemblePracticeOrder below still exists
// unchanged for the slug-based Custom Practice / P001 save path.
export function assemblePracticeModuleIds(state) {
  const { sections, relaxationPosition } = state

  const middle =
    relaxationPosition === 'after'
      ? [...sections.meditation, ...sections.relaxation]
      : [...sections.relaxation, ...sections.meditation]

  return [
    ...sections.tuningIn,
    ...sections.warmup,
    ...sections.asana,
    ...middle,
    ...sections.ending
  ]
}

export function assemblePracticeOrder(state, modules) {
  return assemblePracticeModuleIds(state)
    .map((id) => findModuleById(modules, id))
    .filter(Boolean)
    .map((module) => module.slug)
}
