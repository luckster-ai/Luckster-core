export function calculatePracticeDuration(practice, modules) {
  return practice.modules.reduce((total, moduleSlug) => {
    const module = modules.find((m) => m.slug === moduleSlug)

    if (!module) return total

    return total + module.duration
  }, 0)
}