function findLessonById(foundations, id) {
  for (const foundation of foundations) {
    const lesson = foundation.lessons.find((item) => item.id === id)

    if (lesson) {
      return { lesson, foundationSlug: foundation.slug }
    }
  }

  return null
}

function findModuleById(modules, id) {
  return modules.find((item) => item.id === id) || null
}

// Practice composition (practice.modules) has not been migrated to ID per
// ADR 0003's phased scope — it is still slug-based, so resolving a Practice's
// own Module list still requires a slug lookup. Only prerequisite references
// (inside each Module/Lesson's own `prerequisites` array) are ID-based.
function findModuleBySlug(modules, slug) {
  return modules.find((item) => item.slug === slug) || null
}

function resolveAsset(id, { foundations, modules }) {
  const lessonMatch = findLessonById(foundations, id)

  if (lessonMatch) {
    return {
      type: 'lesson',
      id: lessonMatch.lesson.id,
      slug: lessonMatch.lesson.slug,
      foundationSlug: lessonMatch.foundationSlug,
      prerequisites: lessonMatch.lesson.prerequisites || []
    }
  }

  const module = findModuleById(modules, id)

  if (module) {
    return {
      type: 'module',
      id: module.id,
      slug: module.slug,
      foundationSlug: null,
      prerequisites: module.prerequisites || []
    }
  }

  return null
}

function collectRecursive(id, assets, visited, results) {
  if (visited.has(id)) return
  visited.add(id)

  const asset = resolveAsset(id, assets)

  if (!asset) return

  for (const prerequisiteId of asset.prerequisites) {
    collectRecursive(prerequisiteId, assets, visited, results)
  }

  results.push({
    type: asset.type,
    id: asset.id,
    slug: asset.slug,
    foundationSlug: asset.foundationSlug
  })
}

export function collectPracticePrerequisites(practice, { foundations, modules }) {
  const visited = new Set()
  const results = []

  for (const moduleSlug of practice.modules) {
    const module = findModuleBySlug(modules, moduleSlug)

    if (!module) continue

    for (const prerequisiteId of module.prerequisites || []) {
      collectRecursive(prerequisiteId, { foundations, modules }, visited, results)
    }
  }

  const seen = new Set()

  return results.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
