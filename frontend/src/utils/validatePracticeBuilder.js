import { SECTIONS, sectionsForPracticeType } from './practiceStructure'

// Builder state shape:
// {
//   practiceType: 'full' | 'meditation' | null,
//   relaxationPosition: 'before' | 'after', // relative to Meditation
//   sections: { tuningIn: [moduleId], warmup: [...], asana: [...], relaxation: [...], meditation: [...], ending: [...] }
// }
//
// Sections store canonical Module IDs (not slugs), matching ADR 0003's
// identity model: duplicate prevention across Categories is an ID concern.
// The final assembled Practice (assemblePracticeOrder) converts IDs back to
// slugs, matching the existing practices.js `modules: [slug, ...]` shape.

export function createEmptyBuilderState() {
  return {
    practiceType: null,
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
    if (state.practiceType === 'meditation') {
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

export function validatePracticeComposition(state) {
  if (!state.practiceType) {
    return {
      isStructurallyValid: false,
      sectionResults: [],
      errors: ['請先選擇 Practice 類型（完整練習或冥想練習）。']
    }
  }

  const applicableSections = sectionsForPracticeType(state.practiceType)
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

// Assembles the final playback-ordered slug list, implementing the
// documented Sequence Rule: Tuning In, Warm Up, Asana, then Relaxation and
// Meditation in either order (learner's choice via relaxationPosition), then
// Ending. Within Warm Up / Meditation, module order is whatever the learner
// arranged via the up/down controls.
export function assemblePracticeOrder(state, modules) {
  const { sections, relaxationPosition } = state

  const middle =
    relaxationPosition === 'after'
      ? [...sections.meditation, ...sections.relaxation]
      : [...sections.relaxation, ...sections.meditation]

  const orderedIds = [
    ...sections.tuningIn,
    ...sections.warmup,
    ...sections.asana,
    ...middle,
    ...sections.ending
  ]

  return orderedIds
    .map((id) => findModuleById(modules, id))
    .filter(Boolean)
    .map((module) => module.slug)
}
