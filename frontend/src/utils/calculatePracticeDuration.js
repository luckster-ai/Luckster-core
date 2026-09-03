// Each entry in practice.modules is resolved by Module ID first, slug
// second (Phase 6D) -- Official Practices authored via the Supabase-backed
// store (state/officialPracticeStore.js) reference Modules by ID, while
// P001 and every Custom Practice still use slugs. ID and slug formats
// never overlap ('MT001' vs 'tuning01-standard'), so this is unambiguous,
// same as resolvePracticeModules.js's findModuleByRef.
export function calculatePracticeDuration(practice, modules) {
  return practice.modules.reduce((total, ref) => {
    const module = modules.find((m) => m.id === ref || m.slug === ref)

    if (!module) return total

    return total + module.duration
  }, 0)
}
