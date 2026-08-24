import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import modules from '../data/modules'
import { usePracticeBuilder } from '../hooks/usePracticeBuilder'
import {
  validatePracticeComposition,
  validateSection,
  getCapabilityNote,
  getSectionDuration,
  getTotalDuration,
  assemblePracticeOrder,
  buildBuilderStateFromPractice
} from '../utils/validatePracticeBuilder'
import { sectionsForPracticeType, derivePracticeType, PRACTICE_TYPES, getSection } from '../utils/practiceStructure'
import { saveCustomPractice, generateCustomPracticeSlug, getCustomPractice } from '../state/customPracticeStore'
import PracticeSectionCanvas from './PracticeSectionCanvas'
import PracticeCompositionOverview from './PracticeCompositionOverview'
import MobileSectionOverview from './MobileSectionOverview'
import MobileSectionNav from './MobileSectionNav'
import MobileModulePanel from './MobileModulePanel'

function PracticeBuilder() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Sprint 1E — Part C: /practice/build?edit={slug} reopens an existing
  // saved Practice for editing instead of always starting a blank one.
  // Read once per mount (editSlug/existingPractice don't need to be
  // reactive to further state changes — the Builder owns the state from
  // here on, same as usePracticeBuilder's own lazy-init contract).
  const editSlug = searchParams.get('edit')
  const existingPractice = editSlug ? getCustomPractice(editSlug) : null

  const [state, actions] = usePracticeBuilder(
    existingPractice ? buildBuilderStateFromPractice(existingPractice, modules) : undefined
  )
  const [activeSectionKey, setActiveSectionKey] = useState('tuningIn')
  // Sprint 1D — Desktop Workbench only. Deliberately separate from
  // activeSectionKey (which still drives the Mobile/Tablet Level 2
  // accordion, untouched): starts at null so the Desktop page shows
  // only the six-section composition on load, with no Picker open,
  // per the approved "initial page: composition only" requirement.
  // Reusing activeSectionKey for this would have forced the Desktop
  // Picker open on load too, since that state defaults to 'tuningIn'
  // for the Mobile/Tablet accordion's existing behavior.
  const [activeWorkbenchSection, setActiveWorkbenchSection] = useState(null)
  const [practiceName, setPracticeName] = useState(existingPractice?.chineseTitle || '')
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false)

  const composition = validatePracticeComposition(state)
  const practiceType = derivePracticeType(state)
  const allSelectedIds = Object.values(state.sections).flat()
  const totalDuration = getTotalDuration(state, modules)

  // Maps each already-selected Module ID to the Category label of the
  // section it's actually in, so a disabled candidate shown elsewhere (e.g.
  // a multi-category Module) can say which section it was added to, instead
  // of a generic "already in this Practice" message.
  const moduleSectionLabels = Object.entries(state.sections).reduce((labels, [sectionKey, ids]) => {
    const section = getSection(sectionKey)

    ids.forEach((id) => {
      labels[id] = section?.category
    })

    return labels
  }, {})

  const isNameValid = practiceName.trim().length > 0
  const canSave = composition.isStructurallyValid && isNameValid

  function handleAdd(sectionConfig, moduleId) {
    actions.addModule(sectionConfig.key, moduleId)

    // Once a section reaches its quantity cap (e.g. Tuning In's exactly-1,
    // or Relaxation's exactly-1), auto-advance to the next section so a
    // completed section collapses out of the way. Sections with room for
    // more (Warm Up up to 3, Meditation unlimited) stay open — the learner
    // decides when they're done and moves on manually.
    const reachedCap = state.sections[sectionConfig.key].length + 1 >= sectionConfig.max

    if (reachedCap) {
      const currentIndex = sections.findIndex((item) => item.key === sectionConfig.key)
      const nextSection = sections[currentIndex + 1]
      setActiveSectionKey(nextSection ? nextSection.key : null)
    }
  }

  // Sprint 1D — Desktop Workbench. Opening a different Section's Picker
  // replaces the active one (single state slot); clicking the
  // already-active Section's own button closes it. Reuses the same
  // actions.addModule reducer as the Level 2 editors — no new selection
  // logic. Mirrors handleAdd's "close once the Section is full" idea,
  // adapted to "close" instead of "auto-advance to the next Section"
  // since the Workbench has no linear next-Section concept.
  function handleOpenPicker(sectionKey) {
    setActiveWorkbenchSection((current) => (current === sectionKey ? null : sectionKey))
  }

  function handleWorkbenchAdd(sectionKey, moduleId) {
    actions.addModule(sectionKey, moduleId)

    const sectionConfig = sections.find((item) => item.key === sectionKey)
    const reachedCap = sectionConfig && state.sections[sectionKey].length + 1 >= sectionConfig.max

    if (reachedCap) {
      setActiveWorkbenchSection(null)
    }
  }

  function handleSave() {
    setHasAttemptedSave(true)

    if (!canSave) return

    // Sprint 1E — Part C: editing an existing saved Practice reuses its
    // slug, so saveCustomPractice's existing overwrite-by-slug behavior
    // updates it in place instead of creating a duplicate.
    const slug = editSlug && existingPractice ? editSlug : generateCustomPracticeSlug()
    const orderedSlugs = assemblePracticeOrder(state, modules)

    saveCustomPractice({
      id: slug,
      slug,
      title: practiceName.trim(),
      chineseTitle: practiceName.trim(),
      difficulty: 'Beginner',
      description: '由學員自由組課建立的 Practice。',
      isCustom: true,
      modules: orderedSlugs,
      // Exact Builder state, alongside the flat modules list above --
      // lets buildBuilderStateFromPractice reconstruct this Practice
      // for editing without ambiguity for multi-category Modules (see
      // its own comment). modules/orderedSlugs remains the source of
      // truth for playback (PracticePage/PracticePlayer never read
      // this field); this is additive, edit-flow-only data.
      builderSections: state.sections,
      relaxationPosition: state.relaxationPosition
    })

    navigate(`/practices/${slug}`)
  }

  const sections = sectionsForPracticeType(practiceType)

  // Computed once and shared by .builder-sections (Tablet's inline
  // accordion, via PracticeSectionCanvas) and the Mobile-only presentation
  // components below (MobileSectionOverview/MobileSectionNav/
  // MobileModulePanel) — same activeSectionKey, same per-Section data,
  // just two different renderings of it. Not a second state model.
  const sectionsData = sections.map((sectionConfig) => {
    const result = validateSection(sectionConfig.key, state)
    const isExpanded = activeSectionKey === sectionConfig.key

    // Bug fix: Tablet's .builder-sections (PracticeSectionCanvas) and
    // Mobile's .mobile-sections-area (MobileModulePanel) both mount
    // simultaneously in the DOM — only one is visible at a time via CSS,
    // but React renders both subtrees regardless of viewport. Reusing a
    // single relaxationPositionControl element in both meant two native
    // <input type="radio" name="relaxationPosition"> groups existed in
    // the document at once; the browser's native radio-group toggling
    // (which operates on `name` across the whole document, independent
    // of React component boundaries) fought with React's controlled-
    // value reconciliation, so a click could visually check the HIDDEN
    // instance's radio while leaving the clicked, visible one unchecked
    // until an unrelated re-render (e.g. switching Section) re-synced
    // both from state.relaxationPosition. Fix: give each rendering
    // context its own `name` so they're never the same native group.
    // state.relaxationPosition / setRelaxationPosition are untouched —
    // this only changes a DOM grouping detail, not the data.
    const buildRelaxationPositionControl = (radioName) => (
      <fieldset className="builder-relaxation-position">
        <legend>Relaxation 位置</legend>

        <label>
          <input
            type="radio"
            name={radioName}
            checked={state.relaxationPosition === 'before'}
            onChange={() => actions.setRelaxationPosition('before')}
          />
          在 Meditation 之前
        </label>

        <label>
          <input
            type="radio"
            name={radioName}
            checked={state.relaxationPosition === 'after'}
            onChange={() => actions.setRelaxationPosition('after')}
          />
          在 Meditation 之後
        </label>
      </fieldset>
    )

    const isRelaxation = sectionConfig.key === 'relaxation'

    return {
      sectionConfig,
      result,
      moduleIds: state.sections[sectionConfig.key],
      capabilityNote: getCapabilityNote(sectionConfig.key, state, modules),
      isExpanded,
      sectionDuration: getSectionDuration(sectionConfig.key, state, modules),
      onToggle: () => setActiveSectionKey(isExpanded ? null : sectionConfig.key),
      onAdd: (moduleId) => handleAdd(sectionConfig, moduleId),
      onRemove: (moduleId) => actions.removeModule(sectionConfig.key, moduleId),
      onMove: (moduleId, direction) => actions.moveModule(sectionConfig.key, moduleId, direction),
      relaxationPositionControl: isRelaxation ? buildRelaxationPositionControl('relaxationPosition') : null,
      mobileRelaxationPositionControl: isRelaxation ? buildRelaxationPositionControl('mobileRelaxationPosition') : null
    }
  })

  const activeSectionData = sectionsData.find((data) => data.isExpanded) || null

  return (
    <div className="practice-builder">
      <h1>{existingPractice ? '編輯課程' : '建立新課程'}</h1>

      {/* Level 1 "Practice Composition Overview" (Project Master Review's
          Level 1 / Level 2 distinction) — replaces the Sprint 8.8
          counters-only summary bar. Still a pure view over existing state
          (see getTotalDuration/getSectionDuration), not a second source of
          truth. Responsive architecture: Desktop grid workbench with a
          connecting rail (Sprint 1D — "+ 加入 Module" opens a real Picker
          in a shared slot below the grid via activeWorkbenchSection/
          onOpenPicker/onWorkbenchAdd, and the Level 2 accordion below is
          hidden at Desktop widths, see .builder-sections in App.css).
          Mobile Practice Builder: this component's Mobile output is just
          the persistent "練習"/rail header — the six Section cards
          themselves are the dedicated Mobile presentation further down
          (MobileSectionOverview/MobileSectionNav/MobileModulePanel), not
          this component's Desktop/Tablet grid. */}
      <PracticeCompositionOverview
        sections={sections}
        state={state}
        modules={modules}
        totalDuration={totalDuration}
        practiceType={practiceType}
        activeWorkbenchSection={activeWorkbenchSection}
        onOpenPicker={handleOpenPicker}
        onWorkbenchAdd={handleWorkbenchAdd}
        onWorkbenchRemove={(sectionKey, moduleId) => actions.removeModule(sectionKey, moduleId)}
        onWorkbenchMove={(sectionKey, moduleId, direction) => actions.moveModule(sectionKey, moduleId, direction)}
        allSelectedIds={allSelectedIds}
        moduleSectionLabels={moduleSectionLabels}
        onSetRelaxationPosition={actions.setRelaxationPosition}
      />

      <p className="section-description">
        目前類型：{practiceType === PRACTICE_TYPES.FULL ? '完整練習 Full Practice' : '冥想練習 Meditation Practice'}
        {' '}
        <span className="builder-type-hint">
          （加入體式 Asana 即成為完整練習，不加入則為冥想練習）
        </span>
      </p>

      <label className="builder-name-field">
        Practice 名稱
        <input
          type="text"
          value={practiceName}
          onChange={(event) => setPracticeName(event.target.value)}
          placeholder="例如：晨間能量練習"
        />
      </label>

      {/* Tablet's inline accordion (768–1023px). Hidden on Desktop
          (≥1024px, unchanged) and now also hidden on Mobile (≤767px,
          replaced by the dedicated Mobile presentation below) — see
          .builder-sections in App.css. */}
      <div className="builder-sections">
        {sectionsData.map((data) => (
          <PracticeSectionCanvas
            key={data.sectionConfig.key}
            result={data.result}
            moduleIds={data.moduleIds}
            modules={modules}
            allSelectedIds={allSelectedIds}
            moduleSectionLabels={moduleSectionLabels}
            capabilityNote={data.capabilityNote}
            isExpanded={data.isExpanded}
            sectionDuration={data.sectionDuration}
            onToggle={data.onToggle}
            onAdd={data.onAdd}
            onRemove={data.onRemove}
            onMove={data.onMove}
            relaxationPositionControl={data.relaxationPositionControl}
            revealAddedInPlace
          />
        ))}
      </div>

      {/* Mobile-only (≤767px): two presentations of the exact same
          sectionsData/activeSectionKey above — reference-01 "Overview"
          when no Section is active, reference-02/03 "Module Selection"
          (compact Section strip + large Picker) once one is. Same
          Practice state throughout; no second state model, no route
          change. See .mobile-overview-grid / .mobile-nav-grid in
          App.css for the Mobile-only visibility scoping. */}
      <div className="mobile-sections-area">
        {activeSectionData ? (
          <>
            <MobileSectionNav sectionsData={sectionsData} modules={modules} />

            <MobileModulePanel
              sectionConfig={activeSectionData.sectionConfig}
              result={activeSectionData.result}
              moduleIds={activeSectionData.moduleIds}
              modules={modules}
              allSelectedIds={allSelectedIds}
              moduleSectionLabels={moduleSectionLabels}
              capabilityNote={activeSectionData.capabilityNote}
              sectionDuration={activeSectionData.sectionDuration}
              onAdd={activeSectionData.onAdd}
              onRemove={activeSectionData.onRemove}
              onMove={activeSectionData.onMove}
              relaxationPositionControl={activeSectionData.mobileRelaxationPositionControl}
              revealAddedInPlace
            />
          </>
        ) : (
          <MobileSectionOverview sectionsData={sectionsData} modules={modules} />
        )}
      </div>

      {composition.errors.length > 0 && (
        <ul className={hasAttemptedSave ? 'builder-errors' : 'builder-progress'}>
          {composition.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {!isNameValid && (
        <p className={hasAttemptedSave ? 'builder-errors' : 'builder-progress'}>請輸入 Practice 名稱。</p>
      )}

      <button
        type="button"
        className={`builder-save${canSave ? '' : ' builder-save-pending'}`}
        onClick={handleSave}
      >
        儲存 Practice
      </button>
    </div>
  )
}

export default PracticeBuilder
