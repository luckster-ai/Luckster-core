export function resolvePracticeModules(practice, modules) {
  return practice.modules
    .map((slug) => modules.find((m) => m.slug === slug))
    .filter(Boolean)
}
