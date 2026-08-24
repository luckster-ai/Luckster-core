import { getModuleAvailability, groupModulesBySubcategory } from '../utils/validatePracticeBuilder'
import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'
import { formatVideoDuration } from '../utils/formatDuration'

// Picker presentation for the Stage 1A UX slice (Warm Up only). Filtering
// and eligibility are unchanged from ModulePicker.jsx (same Category
// filter, same-section exclusion, same groupModulesBySubcategory /
// getModuleAvailability calls) -- only the visual output differs, per the
// approved B+A hybrid direction. ModulePicker.jsx itself is untouched and
// still serves every other section.
function PickerPieceCard({ module, disabled, reason, onAdd }) {
  const thumbnailUrl = getModuleThumbnailUrl(module)

  return (
    <li className={`piece-card piece-card--picker${disabled ? ' disabled' : ''}`}>
      <div className="piece-card-image">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={module.chineseTitle} loading="lazy" />
        ) : (
          <div className="piece-card-image-fallback" aria-hidden="true">{module.chineseTitle.slice(0, 1)}</div>
        )}
      </div>

      <div className="piece-card-body">
        <p className="piece-card-title">{module.chineseTitle}</p>
        <p className="piece-card-meta">
          {module.subcategory ? `${module.subcategory} · ` : ''}{formatVideoDuration(module.duration)}
        </p>

        <button
          type="button"
          className="piece-card-add"
          disabled={disabled}
          onClick={() => onAdd(module.id)}
        >
          {disabled ? reason : '＋ 加入'}
        </button>
      </div>
    </li>
  )
}

// revealAddedInPlace (Mobile Practice Builder redesign): when true, a
// Module already selected in THIS section stays visible in the grid
// (marked "已加入" via getModuleAvailability's existing disabled-reason
// mechanism, same as a cross-section conflict) instead of being
// filtered out entirely. Defaults to false so every existing caller --
// Desktop's DesktopActivePicker, and Mobile/Tablet's own Warm-Up-only
// usage before this redesign -- keeps its exact prior behavior/render
// output unless it explicitly opts in.
function ModulePickerCanvas({ category, modules, currentSectionIds, disabledIds, moduleSectionLabels, onAdd, revealAddedInPlace = false }) {
  const candidates = modules
    .filter((module) => module.categories.includes(category))
    .filter((module) => revealAddedInPlace || !currentSectionIds.includes(module.id))

  if (candidates.length === 0) {
    return <p className="canvas-picker-empty">目前沒有屬於「{category}」的 Module。</p>
  }

  const groups = groupModulesBySubcategory(candidates)

  return (
    <div className="canvas-picker">
      <p className="canvas-picker-label">可加入的 Module</p>

      {groups.map((group) => (
        <div className="canvas-picker-group" key={group.subcategory ?? '__ungrouped'}>
          {group.subcategory && (
            <p className="canvas-picker-group-label">{group.subcategory}</p>
          )}

          <ul className="piece-list piece-list--picker">
            {group.modules.map((module) => {
              const { disabled, reason } = getModuleAvailability(module.id, { disabledIds, moduleSectionLabels })
              const alreadyInThisSection = revealAddedInPlace && currentSectionIds.includes(module.id)

              return (
                <PickerPieceCard
                  key={module.id}
                  module={module}
                  disabled={disabled}
                  reason={alreadyInThisSection ? '已加入' : reason}
                  onAdd={onAdd}
                />
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default ModulePickerCanvas
