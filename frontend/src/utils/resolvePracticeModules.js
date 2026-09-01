// Each entry in practice.modules is looked up by ID first, slug second
// (Phase 6B) -- P001 and every Custom Practice still use slugs, while a
// new Official Practice authored via the Supabase-backed store
// (state/officialPracticeStore.js) uses Module IDs (ADR 0003). ID and
// slug formats never overlap ('MT001' vs 'tuning01-standard'), so this
// is unambiguous -- no per-Practice flag needed to say which kind a
// given `modules` array uses.
function findModuleByRef(modules, ref) {
  return modules.find((m) => m.id === ref || m.slug === ref)
}

export function resolvePracticeModules(practice, modules) {
  const resolved = practice.modules.map((ref) => findModuleByRef(modules, ref))
  const missingRefs = practice.modules.filter((ref, index) => !resolved[index])

  // Data-error visibility, not a behavior change: a missing Module
  // reference (renamed/removed Module, typo in practices.js) previously
  // vanished silently -- the Practice just played one Module short with
  // no signal anywhere. This still returns the same filtered list
  // (Player/Page behavior for existing valid Practices, including P001,
  // is unchanged), but now surfaces the gap in the console instead of
  // hiding it. The authoritative gate for Official Practices is the
  // separate validation script/store (validateOfficialPractice.js /
  // officialPracticeStore.js) run before publish -- this warn is a
  // safety net for whenever this function runs outside those (e.g. a
  // Custom Practice edited after a Module was renamed).
  if (missingRefs.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `Practice "${practice.slug}" references missing Module(s): ${missingRefs.join(', ')}`
    )
  }

  return resolved.filter(Boolean)
}
