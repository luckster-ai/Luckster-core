// Official Practice Architecture — Phase 1.
//
// Validates a Practice entry from data/practices.js against the SAME
// Section rules the Practice Builder already enforces interactively --
// this file intentionally invents no new rule engine. It reuses:
//   - buildBuilderStateFromPractice / validatePracticeComposition /
//     assemblePracticeOrder (validatePracticeBuilder.js) for structure
//   - resolvePracticeModules (resolvePracticeModules.js) for Module lookup
//
// This is meant to be run outside the Builder UI (see
// frontend/scripts/validate-official-practices.mjs), so an Official
// Practice's correctness can be checked before it's ever opened in a
// browser.
import { resolvePracticeModules } from './resolvePracticeModules.js'
import {
  buildBuilderStateFromPractice,
  validatePracticeComposition,
  assemblePracticeOrder
} from './validatePracticeBuilder.js'

// ID first, slug second (Phase 6B) -- see resolvePracticeModules.js's
// findModuleByRef for why this is unambiguous. Field name kept as
// missingModuleSlugs (not renamed) since it's already part of this
// function's and validate-official-practices.mjs's public output shape;
// a missing entry can now be either an ID or a slug.
function getMissingModuleSlugs(practice, modules) {
  return practice.modules.filter((ref) => !modules.some((module) => module.id === ref || module.slug === ref))
}

// builderSections stores Module IDs (see validatePracticeBuilder.js) --
// a Practice can theoretically reference an ID that no longer exists
// (a Module was renamed/removed) even if every *slug* in `modules`
// still resolves, so this is checked separately from the slug check
// above.
function getMissingBuilderSectionIds(practice, modules) {
  if (!practice.builderSections) return []

  const allIds = Object.values(practice.builderSections).flat()
  return allIds.filter((id) => !modules.some((module) => module.id === id))
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

// Bunny readiness is deliberately NOT a stored field -- it's derived
// fresh from each resolved Module's actual videoReference.provider every
// time this runs, so it can never go stale the way a hand-maintained
// boolean would once a Module is migrated (or added) later. A Practice
// with zero resolvable Modules is never "ready" (an empty .every() would
// otherwise vacuously return true).
export function isBunnyReady(practice, modules) {
  const resolved = resolvePracticeModules(practice, modules)
  return resolved.length > 0 && resolved.every((module) => module.videoReference?.provider === 'bunny')
}

// Section/order validation only makes sense relative to builderSections
// (the actual authored composition) -- a Practice saved before that field
// existed (e.g. P001) has no independent composition to compare its
// `modules` order against, so orderCheck is reported as 'not-applicable'
// rather than silently passing or failing. isStructurallyValid still runs
// either way, via buildBuilderStateFromPractice's own documented fallback
// (Module `type` field), same as the Builder's "reopen and edit" flow
// already relies on.
export function validateOfficialPracticeStructure(practice, modules) {
  const missingModuleSlugs = getMissingModuleSlugs(practice, modules)
  const missingBuilderSectionIds = getMissingBuilderSectionIds(practice, modules)

  const builderState = buildBuilderStateFromPractice(practice, modules)
  const composition = validatePracticeComposition(builderState)

  let orderCheck = 'not-applicable'
  let assembledOrder = null

  if (practice.builderSections) {
    assembledOrder = assemblePracticeOrder(builderState, modules)
    orderCheck = arraysEqual(assembledOrder, practice.modules) ? 'match' : 'mismatch'
  }

  const bunnyReady = isBunnyReady(practice, modules)

  // Bunny-ready is now a blocking condition for canPublish (Phase 1
  // close-out): a Published Official Practice is exactly what promises
  // P001's already-verified full continuous/immersive playback, so it
  // must actually meet the same condition P001 does. This is scoped
  // deliberately narrow -- it's a property of THIS function's canPublish
  // result only. Nothing here touches Module.videoReference, ModulePage,
  // VideoPlayer, or customPracticeStore, so a single Module page still
  // plays any provider, and a Custom Practice still saves/plays any
  // provider mix -- neither path calls into this file at all.
  const canPublish =
    missingModuleSlugs.length === 0 &&
    missingBuilderSectionIds.length === 0 &&
    composition.isStructurallyValid &&
    orderCheck !== 'mismatch' &&
    bunnyReady

  return {
    missingModuleSlugs,
    missingBuilderSectionIds,
    sectionErrors: composition.errors,
    isStructurallyValid: composition.isStructurallyValid,
    orderCheck,
    assembledOrder,
    isBunnyReady: bunnyReady,
    canPublish
  }
}
