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
import PracticeBuilderSection from './PracticeBuilderSection'
import PracticeSectionCanvas from './PracticeSectionCanvas'
import PracticeCompositionOverview from './PracticeCompositionOverview'

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

  return (
    <div className="practice-builder">
      <h1>{existingPractice ? '編輯課程' : '建立新課程'}</h1>

      {/* Level 1 "Practice Composition Overview" (Project Master Review's
          Level 1 / Level 2 distinction) — replaces the Sprint 8.8
          counters-only summary bar. Still a pure view over existing state
          (see getTotalDuration/getSectionDuration), not a second source of
          truth. Responsive architecture from Stage 1C (desktop grid
          workbench with a connecting rail / mobile vertical flow with a
          persistent sticky header) — see PracticeCompositionOverview.jsx.
          Sprint 1D made the Desktop grid a real composition workspace:
          "+ 加入 Module" opens a real Picker in a shared slot below the
          grid (activeWorkbenchSection/onOpenPicker/onWorkbenchAdd), and
          the old Level 2 accordion below is hidden at Desktop widths
          (see .builder-sections in App.css). Mobile/Tablet still use
          onNavigateToSection exactly as Stage 1C left it — "+ 加入
          Module" there still just sets activeSectionKey and the Level 2
          accordion below (still rendered, just hidden on Desktop) is
          the actual editor. */}
      <PracticeCompositionOverview
        sections={sections}
        state={state}
        modules={modules}
        totalDuration={totalDuration}
        practiceType={practiceType}
        onNavigateToSection={(sectionKey) => setActiveSectionKey(sectionKey)}
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

      <div className="builder-sections">
        {sections.map((sectionConfig) => {
          const result = validateSection(sectionConfig.key, state)
          const capabilityNote = getCapabilityNote(sectionConfig.key, state, modules)
          const isExpanded = activeSectionKey === sectionConfig.key

          const relaxationPositionControl =
            sectionConfig.key === 'relaxation' ? (
              <fieldset className="builder-relaxation-position">
                <legend>Relaxation 位置</legend>

                <label>
                  <input
                    type="radio"
                    name="relaxationPosition"
                    checked={state.relaxationPosition === 'before'}
                    onChange={() => actions.setRelaxationPosition('before')}
                  />
                  在 Meditation 之前
                </label>

                <label>
                  <input
                    type="radio"
                    name="relaxationPosition"
                    checked={state.relaxationPosition === 'after'}
                    onChange={() => actions.setRelaxationPosition('after')}
                  />
                  在 Meditation 之後
                </label>
              </fieldset>
            ) : null

          const sectionProps = {
            result,
            moduleIds: state.sections[sectionConfig.key],
            modules,
            allSelectedIds,
            moduleSectionLabels,
            capabilityNote,
            isExpanded,
            sectionDuration: getSectionDuration(sectionConfig.key, state, modules),
            onToggle: () => setActiveSectionKey(isExpanded ? null : sectionConfig.key),
            onAdd: (moduleId) => handleAdd(sectionConfig, moduleId),
            onRemove: (moduleId) => actions.removeModule(sectionConfig.key, moduleId),
            onMove: (moduleId, direction) => actions.moveModule(sectionConfig.key, moduleId, direction),
            relaxationPositionControl
          }

          // Stage 1A UX slice (approved B+A hybrid direction): only Warm Up
          // renders via the new composition-canvas presentation for now.
          // Every other section continues to use the unchanged,
          // already-validated PracticeBuilderSection until this direction
          // is reviewed and explicitly approved for propagation.
          const SectionComponent = sectionConfig.key === 'warmup' ? PracticeSectionCanvas : PracticeBuilderSection

          return <SectionComponent key={sectionConfig.key} {...sectionProps} />
        })}
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
