import ModulePickerCanvas from './ModulePickerCanvas'
import { PieceCard } from './PieceCard'
import { statusLabel } from '../utils/sectionStatusLabel'
import { formatVideoDuration } from '../utils/formatDuration'

// Mobile Practice Builder — reference-02/03 "Module Selection" state's
// primary work area: the large Module Picker for whichever Section is
// currently active (paired with the compact MobileSectionNav strip next
// to it). Content is the same data/logic PracticeSectionCanvas's
// expanded branch already renders for Tablet (shared PieceCard/
// statusLabel, same ModulePickerCanvas + revealAddedInPlace) — this is a
// separate Mobile-only component rather than a shared one so Tablet's
// existing inline-accordion behavior is never at risk of changing.
function MobileModulePanel({
  sectionConfig,
  result,
  moduleIds,
  modules,
  allSelectedIds,
  moduleSectionLabels,
  capabilityNote,
  sectionDuration,
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
  const zhLabel = sectionConfig.label.split(' ')[0]

  return (
    <section className={`canvas-section canvas-section--${result.key} expanded`}>
      <div className="canvas-section-picker-head">
        <div className="canvas-section-picker-title">
          <span className="zh">選擇 {zhLabel} 影片</span>
          <span className="canvas-section-status">
            {hasSelected ? `${result.count} 部 · ${formatVideoDuration(sectionDuration)}` : `${result.count} 部`}
            {' · '}
            {statusLabel(result)}
          </span>
        </div>
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
    </section>
  )
}

export default MobileModulePanel
