import { getSectionDuration } from '../utils/validatePracticeBuilder'
import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'
import { formatVideoDuration } from '../utils/formatDuration'
import { PRACTICE_TYPES } from '../utils/practiceStructure'
import DesktopActivePicker from './DesktopActivePicker'

// Stage 1C: "Level 1 — Practice Composition" overview, responsive
// architecture. Desktop/mobile are NOT the same layout scaled -- see the
// prototype comparison (System 1 "Boxed Workbench" vs System 2
// "Connected Rail Workbench") that led to this synthesis:
//
// - Desktop (>=1024px): a CSS-grid Workbench (six columns) with a thin
//   connecting gradient rail across the top -- no horizontal scrolling.
//   Sprint 1D made this the REAL Desktop composition surface: Module
//   cards carry working reorder/remove controls, and "+ 加入 Module"
//   opens a real Picker (DesktopActivePicker, reusing ModulePickerCanvas
//   unchanged) in a single shared slot below the grid -- switching
//   Sections replaces the active Picker rather than stacking. The old
//   Level 2 accordion below is hidden at this width (see .builder-sections
//   in App.css) so there is no duplicate editing surface.
// - Tablet (768-1023px): unchanged from Stage 1C -- the grid still
//   renders (3 columns) as a read-only-ish overview whose "+ 加入 Module"
//   still navigates to the Level 2 accordion below (onNavigateToSection),
//   exactly as before this Sprint. Not redesigned here.
// - Mobile (<768px): unchanged from Stage 1C -- vertical numbered
//   Practice Flow + persistent sticky header, "+ 加入 Module" navigates
//   to the Level 2 accordion below. Not touched by this Sprint.
function ModuleChip({ module }) {
  const thumbnailUrl = getModuleThumbnailUrl(module)

  return (
    <li className="overview-chip">
      <div className="overview-chip-image">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={module.chineseTitle} loading="lazy" />
        ) : (
          <div className="overview-chip-image-fallback" aria-hidden="true">{module.chineseTitle.slice(0, 1)}</div>
        )}
      </div>

      <div className="overview-chip-body">
        <p className="overview-chip-title">{module.chineseTitle}</p>
        <p className="overview-chip-meta">
          {module.subcategory ? `${module.subcategory} · ` : ''}{formatVideoDuration(module.duration)}
        </p>
      </div>
    </li>
  )
}

// Desktop Workbench-only card: same visual language as ModuleChip plus
// working reorder/remove controls, since Sprint 1D removes the old
// Level 2 editors from the Desktop page -- this is now the only place
// on Desktop those actions are available. Not used by FlowSection
// (Mobile), which keeps ModuleChip exactly as Stage 1C left it.
//
// Sprint 1F: compacted at Desktop (>=1024px) into a small "piece" --
// single-line truncated title, Subcategory hidden, duration + controls
// sharing one footer row. The Subcategory text is still rendered (in
// its own .overview-chip-subcategory span) rather than removed from
// the JSX, and .overview-chip-footer keeps its normal stacked block
// flow unless overridden -- both are then hidden/rearranged only
// inside a `min-width: 1024px` media query in App.css, so this exact
// same component still renders exactly as before at Tablet width
// (768-1023px), where the grid also appears. See that media query for
// the actual Desktop-only visual change.
function WorkbenchCard({ module, index, total, sectionKey, onRemove, onMove }) {
  const thumbnailUrl = getModuleThumbnailUrl(module)

  return (
    <li className="overview-chip overview-chip--workbench">
      <div className="overview-chip-image">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={module.chineseTitle} loading="lazy" />
        ) : (
          <div className="overview-chip-image-fallback" aria-hidden="true">{module.chineseTitle.slice(0, 1)}</div>
        )}
      </div>

      <div className="overview-chip-body">
        <p className="overview-chip-title" title={module.chineseTitle}>{module.chineseTitle}</p>

        <div className="overview-chip-footer">
          <p className="overview-chip-meta">
            {module.subcategory && (
              <span className="overview-chip-subcategory">{module.subcategory} · </span>
            )}
            {formatVideoDuration(module.duration)}
          </p>

          <div className="overview-chip-controls">
            <button type="button" onClick={() => onMove(sectionKey, module.id, 'up')} disabled={index === 0} aria-label="上移">↑</button>
            <button type="button" onClick={() => onMove(sectionKey, module.id, 'down')} disabled={index === total - 1} aria-label="下移">↓</button>
            <button type="button" onClick={() => onRemove(sectionKey, module.id)} aria-label="移除">✕</button>
          </div>
        </div>
      </div>
    </li>
  )
}

function sectionModulesFor(sectionConfig, state, modules) {
  return state.sections[sectionConfig.key]
    .map((id) => modules.find((module) => module.id === id))
    .filter(Boolean)
}

function WorkbenchColumn({ sectionConfig, state, modules, sectionDuration, isActive, onOpenPicker, onRemove, onMove }) {
  const sectionModules = sectionModulesFor(sectionConfig, state, modules)
  const zhLabel = sectionConfig.label.split(' ')[0]

  return (
    <div className={`overview-col overview-col--${sectionConfig.key}${isActive ? ' overview-col--active' : ''}`}>
      <div className="overview-col-head">
        <span className="zh">{zhLabel}</span>
        <span className="meta">
          {sectionModules.length} 部{sectionModules.length > 0 ? ` · ${formatVideoDuration(sectionDuration)}` : ''}
        </span>
      </div>

      {/* Sprint 1E — Part A: the "尚未加入" placeholder is intentionally
          NOT rendered here (unlike FlowSection/Mobile below, which keeps
          it). An empty Section's "0 部" header already signals emptiness;
          removing the extra placeholder box is what compresses the
          Workbench's height per the approved direction. */}
      {sectionModules.length > 0 && (
        <ul className="overview-chip-list">
          {sectionModules.map((module, index) => (
            <WorkbenchCard
              key={module.id}
              module={module}
              index={index}
              total={sectionModules.length}
              sectionKey={sectionConfig.key}
              onRemove={onRemove}
              onMove={onMove}
            />
          ))}
        </ul>
      )}

      <button type="button" className="overview-add-btn" onClick={() => onOpenPicker(sectionConfig.key)}>
        ＋ 加入影片
      </button>
    </div>
  )
}

function FlowSection({ sectionConfig, index, state, modules, sectionDuration, onNavigateToSection }) {
  const sectionModules = sectionModulesFor(sectionConfig, state, modules)
  const zhLabel = sectionConfig.label.split(' ')[0]

  return (
    <div className={`overview-flow-section overview-col--${sectionConfig.key}`}>
      <div className="overview-flow-head">
        <span className="overview-flow-num">{index + 1}</span>
        <span className="zh">{zhLabel}</span>
        <span className="meta">
          {sectionModules.length} 部{sectionModules.length > 0 ? ` · ${formatVideoDuration(sectionDuration)}` : ''}
        </span>
      </div>

      {sectionModules.length > 0 ? (
        <ul className="overview-chip-list">
          {sectionModules.map((module) => (
            <ModuleChip key={module.id} module={module} />
          ))}
        </ul>
      ) : (
        <p className="overview-empty">尚未加入</p>
      )}

      <button type="button" className="overview-add-btn" onClick={() => onNavigateToSection(sectionConfig.key)}>
        ＋ 加入 Module
      </button>
    </div>
  )
}

function PracticeCompositionOverview({
  sections,
  state,
  modules,
  totalDuration,
  practiceType,
  onNavigateToSection,
  activeWorkbenchSection,
  onOpenPicker,
  onWorkbenchAdd,
  onWorkbenchRemove,
  onWorkbenchMove,
  allSelectedIds,
  moduleSectionLabels,
  onSetRelaxationPosition
}) {
  const totalLabel = totalDuration > 0 ? formatVideoDuration(totalDuration) : '尚未加入影片'
  const typeLabel = practiceType === PRACTICE_TYPES.FULL ? '完整練習 Full Practice' : '冥想練習 Meditation Practice'
  const activeSectionConfig = sections.find((sectionConfig) => sectionConfig.key === activeWorkbenchSection) || null

  return (
    <div aria-live="polite">
      {/* Mobile-only: persistent sticky orientation while scrolling
          through the vertical flow below. Untouched by Sprint 1D. */}
      <div className="overview-sticky">
        <span className="overview-sticky-total">總時長 {totalLabel}</span>
        <div className="overview-sticky-dots">
          {sections.map((sectionConfig) => (
            <span
              key={sectionConfig.key}
              className={`overview-sticky-dot${state.sections[sectionConfig.key].length > 0 ? ` overview-sticky-dot--${sectionConfig.key}` : ' empty'}`}
            />
          ))}
        </div>
      </div>

      {/* Desktop / tablet: grid workbench with a connecting rail. */}
      <div className="overview-card">
        <div className="overview-head">
          <h2>練習</h2>
          <span className="overview-sub">總時長 {totalLabel} · {typeLabel}</span>
        </div>

        {/* Sprint 1E — Part B. relaxationPosition already exists in
            Builder state and already drives assemblePracticeOrder (the
            actual playback sequence) -- this control already existed
            inside the old Level 2 Relaxation editor, but that editor is
            now hidden on Desktop (Sprint 1D), so there was no way to
            reach it there anymore. This surfaces the same existing
            state/action at Level 1 instead of duplicating it. Only
            meaningful once Relaxation has content. */}
        {state.sections.relaxation.length > 0 && (
          <fieldset className="overview-order-control">
            <legend>放鬆順序</legend>

            <label>
              <input
                type="radio"
                name="overviewRelaxationPosition"
                checked={state.relaxationPosition === 'before'}
                onChange={() => onSetRelaxationPosition('before')}
              />
              在冥想之前
            </label>

            <label>
              <input
                type="radio"
                name="overviewRelaxationPosition"
                checked={state.relaxationPosition === 'after'}
                onChange={() => onSetRelaxationPosition('after')}
              />
              在冥想之後
            </label>
          </fieldset>
        )}

        <div className="overview-rail" />

        <div className="overview-grid">
          {sections.map((sectionConfig) => (
            <WorkbenchColumn
              key={sectionConfig.key}
              sectionConfig={sectionConfig}
              state={state}
              modules={modules}
              sectionDuration={getSectionDuration(sectionConfig.key, state, modules)}
              isActive={activeWorkbenchSection === sectionConfig.key}
              onOpenPicker={onOpenPicker}
              onRemove={onWorkbenchRemove}
              onMove={onWorkbenchMove}
            />
          ))}
        </div>
      </div>

      {/* Desktop-only: the single active Picker slot, per Sprint 1D.
          Hidden below 1024px via CSS. */}
      <DesktopActivePicker
        activeSection={activeSectionConfig}
        moduleIds={activeSectionConfig ? state.sections[activeSectionConfig.key] : []}
        modules={modules}
        allSelectedIds={allSelectedIds}
        moduleSectionLabels={moduleSectionLabels}
        onAdd={(moduleId) => onWorkbenchAdd(activeSectionConfig.key, moduleId)}
        onClose={() => onOpenPicker(activeSectionConfig?.key)}
      />

      {/* Mobile-only: vertical numbered Practice Flow. Untouched by
          Sprint 1D. */}
      <div className="overview-flow">
        {sections.map((sectionConfig, index) => (
          <FlowSection
            key={sectionConfig.key}
            sectionConfig={sectionConfig}
            index={index}
            state={state}
            modules={modules}
            sectionDuration={getSectionDuration(sectionConfig.key, state, modules)}
            onNavigateToSection={onNavigateToSection}
          />
        ))}
      </div>
    </div>
  )
}

export default PracticeCompositionOverview
