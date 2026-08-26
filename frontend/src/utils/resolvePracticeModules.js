export function resolvePracticeModules(practice, modules) {
  const resolved = practice.modules.map((slug) => modules.find((m) => m.slug === slug))
  const missingSlugs = practice.modules.filter((slug, index) => !resolved[index])

  // Data-error visibility, not a behavior change: a missing Module slug
  // (renamed/removed Module, typo in practices.js) previously vanished
  // silently -- the Practice just played one Module short with no signal
  // anywhere. This still returns the same filtered list (Player/Page
  // behavior for existing valid Practices, including P001, is unchanged),
  // but now surfaces the gap in the console instead of hiding it. The
  // authoritative gate for Official Practices is the separate validation
  // script (validateOfficialPractice.js) run before publish -- this warn
  // is a safety net for whenever this function runs outside that script
  // (e.g. a Custom Practice edited after a Module was renamed).
  if (missingSlugs.length > 0 && typeof console !== 'undefined') {
    console.warn(
      `Practice "${practice.slug}" references missing Module slug(s): ${missingSlugs.join(', ')}`
    )
  }

  return resolved.filter(Boolean)
}
