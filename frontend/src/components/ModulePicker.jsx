import { formatVideoDuration } from '../utils/formatDuration'
import { getModuleAvailability, groupModulesBySubcategory } from '../utils/validatePracticeBuilder'

// Shows only Modules relevant to the section being edited (filtered by
// Category), so the picker stays usable as the Module Library grows. Category
// mismatch is a filtering concern — a Module that doesn't belong to this
// Category is never a candidate here, not shown disabled (Sprint 8.6
// architecture review: "Category vs eligibility"). A Module with multiple
// Categories (see module-metadata.md) is discoverable from every section it
// belongs to, but can only be added once per Practice — enforced by
// canonical ID, not by section membership. A candidate already selected in
// THIS section is excluded outright (it's already shown above with
// reorder/remove controls); one selected in another section stays visible
// here, disabled with a reason, via getModuleAvailability.
//
// Candidates are additionally grouped by Subcategory (Sprint 8.7) purely as
// a discovery/presentation aid — it never narrows or hides candidates, only
// labels the existing list. A Module without a Subcategory is grouped
// unlabeled, not assigned an invented category name.
function ModulePicker({ category, modules, currentSectionIds, disabledIds, moduleSectionLabels, onAdd }) {
  const candidates = modules
    .filter((module) => module.categories.includes(category))
    .filter((module) => !currentSectionIds.includes(module.id))

  if (candidates.length === 0) {
    return <p className="module-picker-empty">目前沒有屬於「{category}」的 Module。</p>
  }

  const groups = groupModulesBySubcategory(candidates)

  return (
    <div className="module-picker">
      {groups.map((group) => (
        <div className="module-picker-group" key={group.subcategory ?? '__ungrouped'}>
          {group.subcategory && (
            <p className="module-picker-group-label">{group.subcategory}</p>
          )}

          <ul className="module-picker-list">
            {group.modules.map((module) => {
              const { disabled, reason } = getModuleAvailability(module.id, { disabledIds, moduleSectionLabels })

              return (
                <li key={module.id} className="module-picker-item">
                  <div className="module-picker-info">
                    <span className="module-picker-title">{module.chineseTitle}</span>
                    <span className="module-picker-meta">{formatVideoDuration(module.duration)}</span>
                  </div>

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onAdd(module.id)}
                  >
                    {disabled ? reason : '加入'}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default ModulePicker
