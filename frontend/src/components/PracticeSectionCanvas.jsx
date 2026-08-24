import ModulePickerCanvas from './ModulePickerCanvas'
import { PieceCard } from './PieceCard'
import { statusLabel } from '../utils/sectionStatusLabel'
import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'
import { formatVideoDuration } from '../utils/formatDuration'

// Stage 1A UX slice: "Practice → Section containers → Module cards"
// (Project Master Review, Practice Builder UX recommendation), built as
// the approved Option B (soft composition) + Option A (clear section
// boundary) hybrid. Originally wired to Warm Up only; a later pass
// propagated it to every Section, replacing the old plain-text
// PracticeBuilderSection/ModulePicker pair (both removed).
//
// Mobile Practice Builder — this component is the Level 2 editor for
// TABLET only now (768–1023px; hidden on Desktop ≥1024px via
// .builder-sections in App.css, and hidden on Mobile ≤767px too — see
// the same rule). Mobile has its own dedicated two-state presentation
// (MobileSectionOverview.jsx / MobileSectionNav.jsx / MobileModulePanel.jsx
// in PracticeBuilder.jsx) matching the three design references' actual
// layout, rather than this component's inline collapsed/expanded card.
// PieceCard/statusLabel are shared with MobileModulePanel.jsx (see
// PieceCard.jsx) so the selected-Module detail presentation doesn't
// diverge between Tablet and Mobile, without either changing the other's
// behavior.
//
// No state/validation/rule logic lives here: min/max, derived Practice
// type, capability guidance, prerequisite/eligibility checks are all
// unchanged and still computed by validatePracticeBuilder.js /
// practiceStructure.js. This component only changes how the existing
// data is presented and how add/remove/reorder are triggered.
// Collapsed-card thumbnail preview, capped so a Section with many Modules
// (Meditation has no max) can never grow the compact card unbounded —
// same "+N" pattern used elsewhere in the Builder, not a new convention.
const COLLAPSED_THUMBNAIL_CAP = 4

function CollapsedThumbnails({ sectionModules }) {
  const shown = sectionModules.slice(0, COLLAPSED_THUMBNAIL_CAP)
  const overflow = sectionModules.length - shown.length

  return (
    <ul className="canvas-section-thumbs">
      {shown.map((module) => {
        const thumbnailUrl = getModuleThumbnailUrl(module)

        return (
          <li className="canvas-section-thumb" key={module.id}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" loading="lazy" />
            ) : (
              <span className="canvas-section-thumb-fallback" aria-hidden="true">
                {module.chineseTitle.slice(0, 1)}
              </span>
            )}
          </li>
        )
      })}

      {overflow > 0 && (
        <li className="canvas-section-thumb canvas-section-thumb-more" aria-label={`還有 ${overflow} 部影片`}>
          +{overflow}
        </li>
      )}
    </ul>
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
  relaxationPositionControl,
  revealAddedInPlace = false
}) {
  const sectionModules = moduleIds
    .map((id) => modules.find((module) => module.id === id))
    .filter(Boolean)

  const hasSelected = sectionModules.length > 0
  const canAddMore = result.count < result.max
  const zhLabel = result.label.split(' ')[0]

  return (
    <section className={`canvas-section canvas-section--${result.key}${result.isValid ? ' valid' : ''}${isExpanded ? ' expanded' : ' collapsed'}`}>
      {isExpanded ? (
        <>
          <div className="canvas-section-picker-head">
            <div className="canvas-section-picker-title">
              <span className="zh">選擇 {zhLabel} 影片</span>
              <span className="canvas-section-status">
                {hasSelected ? `${result.count} 部 · ${formatVideoDuration(sectionDuration)}` : `${result.count} 部`}
                {' · '}
                {statusLabel(result)}
              </span>
            </div>

            <button type="button" className="canvas-collapse-btn" onClick={onToggle}>
              收起
            </button>
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
            <ModulePickerCanvas
              category={result.category}
              modules={modules}
              currentSectionIds={moduleIds}
              disabledIds={allSelectedIds}
              moduleSectionLabels={moduleSectionLabels}
              onAdd={onAdd}
              revealAddedInPlace={revealAddedInPlace}
            />
          )}
        </>
      ) : (
        // The toggle is reachable even once a Section is full (canAddMore
        // false) — a full Section (e.g. Tuning In, max 1) still needs a way
        // back into its reorder/remove controls, which now live only in the
        // expanded piece-list (previously always-rendered regardless of
        // collapse state; moved behind isExpanded so the collapsed card can
        // stay compact per reference-01/03).
        <div
          className="canvas-section-collapsed"
          role="button"
          tabIndex={0}
          onClick={onToggle}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onToggle()
            }
          }}
        >
          <div className="canvas-section-title">
            <span className="zh">{zhLabel}</span>
            <span className="tag">{result.required ? '必要' : '可選'}</span>
          </div>

          <span className="canvas-section-collapsed-count">{result.count} 部</span>

          <span className="canvas-section-divider" aria-hidden="true" />

          {hasSelected ? (
            <CollapsedThumbnails sectionModules={sectionModules} />
          ) : (
            <span className="canvas-section-collapsed-add">＋ 加入影片</span>
          )}
        </div>
      )}
    </section>
  )
}

export default PracticeSectionCanvas
