import { formatVideoDuration } from '../utils/formatDuration'

// Shows only Modules relevant to the section being edited (filtered by
// Category), so the picker stays usable as the Module Library grows. A
// Module with multiple Categories (see module-metadata.md) is discoverable
// from every section it belongs to, but can only be added once per Practice
// — enforced here by canonical ID, not by section membership. A candidate
// already selected in THIS section is excluded outright (it's already shown
// above with reorder/remove controls); one selected in another section stays
// visible here, disabled, so its cross-category availability remains clear.
function ModulePicker({ category, modules, currentSectionIds, disabledIds, moduleSectionLabels, onAdd }) {
  const candidates = modules
    .filter((module) => module.categories.includes(category))
    .filter((module) => !currentSectionIds.includes(module.id))

  if (candidates.length === 0) {
    return <p className="module-picker-empty">目前沒有屬於「{category}」的 Module。</p>
  }

  return (
    <ul className="module-picker">
      {candidates.map((module) => {
        const alreadyAdded = disabledIds.includes(module.id)
        const addedToLabel = moduleSectionLabels[module.id]

        return (
          <li key={module.id} className="module-picker-item">
            <div className="module-picker-info">
              <span className="module-picker-title">{module.chineseTitle}</span>
              <span className="module-picker-meta">{formatVideoDuration(module.duration)}</span>
            </div>

            <button
              type="button"
              disabled={alreadyAdded}
              onClick={() => onAdd(module.id)}
            >
              {alreadyAdded
                ? (addedToLabel ? `已加入「${addedToLabel}」` : '已加入此 Practice')
                : '加入'}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export default ModulePicker
