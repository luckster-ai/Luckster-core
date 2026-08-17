import ModulePickerCanvas from './ModulePickerCanvas'
import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'
import { formatVideoDuration } from '../utils/formatDuration'

// Stage 1A UX slice: "Practice → Section containers → Module cards"
// (Project Master Review, Practice Builder UX recommendation), built as
// the approved Option B (soft composition) + Option A (clear section
// boundary) hybrid. Deliberately wired to Warm Up ONLY for now (see
// PracticeBuilder.jsx) -- the component itself is section-agnostic
// (same prop contract as PracticeBuilderSection.jsx) so it can be wired
// to the remaining five sections later without being rewritten, but
// that propagation is an explicit future decision, not assumed here.
//
// No state/validation/rule logic lives here: min/max, derived Practice
// type, capability guidance, prerequisite/eligibility checks are all
// unchanged and still computed by validatePracticeBuilder.js /
// practiceStructure.js. This component only changes how the existing
// data is presented and how add/remove/reorder are triggered.
function statusLabel(result) {
  if (result.count === 0) {
    return result.required ? '尚未加入（必要）' : '尚未加入（可省略）'
  }

  if (result.isValid) {
    return '已完成'
  }

  if (!result.meetsMax) {
    return `超過上限（最多 ${result.max} 部）`
  }

  return '未完成'
}

function PieceCard({ module, index, total, onRemove, onMove }) {
  const thumbnailUrl = getModuleThumbnailUrl(module)

  return (
    <li className="piece-card">
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

        <div className="piece-card-controls">
          <button
            type="button"
            onClick={() => onMove(module.id, 'up')}
            disabled={index === 0}
            aria-label="上移"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(module.id, 'down')}
            disabled={index === total - 1}
            aria-label="下移"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onRemove(module.id)}
            aria-label="移除"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  )
}

function PracticeSectionCanvas({
  result,
  moduleIds,
  modules,
  allSelectedIds,
  moduleSectionLabels,
  capabilityNote,
  isExpanded,
  sectionDuration,
  onToggle,
  onAdd,
  onRemove,
  onMove,
  relaxationPositionControl
}) {
  const sectionModules = moduleIds
    .map((id) => modules.find((module) => module.id === id))
    .filter(Boolean)

  const hasSelected = sectionModules.length > 0
  const canAddMore = result.count < result.max

  return (
    <section className={`canvas-section canvas-section--${result.key}${result.isValid ? ' valid' : ''}`}>
      <div className="canvas-section-header">
        <div className="canvas-section-title">
          <span className="zh">{result.label}</span>
          <span className="tag">{result.required ? '必要' : '可選'}</span>
        </div>

        <span className="canvas-section-status">
          {hasSelected ? `${result.count} 部 · ${formatVideoDuration(sectionDuration)}` : `${result.count} 部`}
          {' · '}
          {statusLabel(result)}
        </span>
      </div>

      {capabilityNote && <p className="canvas-capability-note">{capabilityNote}</p>}

      {relaxationPositionControl}

      {hasSelected ? (
        <ul className="piece-list">
          {sectionModules.map((module, index) => (
            <PieceCard
              key={module.id}
              module={module}
              index={index}
              total={sectionModules.length}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
        </ul>
      ) : (
        <p className="canvas-empty">{result.guidance}</p>
      )}

      {canAddMore && (
        isExpanded ? (
          <>
            <ModulePickerCanvas
              category={result.category}
              modules={modules}
              currentSectionIds={moduleIds}
              disabledIds={allSelectedIds}
              moduleSectionLabels={moduleSectionLabels}
              onAdd={onAdd}
            />

            <button type="button" className="canvas-collapse-btn" onClick={onToggle}>
              收起
            </button>
          </>
        ) : (
          <button type="button" className="canvas-add-btn" onClick={onToggle}>
            ＋ 加入 Module
          </button>
        )
      )}
    </section>
  )
}

export default PracticeSectionCanvas
