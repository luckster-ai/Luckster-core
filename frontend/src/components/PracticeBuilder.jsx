import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import modules from '../data/modules'
import { usePracticeBuilder } from '../hooks/usePracticeBuilder'
import {
  validatePracticeComposition,
  validateSection,
  getCapabilityNote,
  assemblePracticeOrder
} from '../utils/validatePracticeBuilder'
import { sectionsForPracticeType, PRACTICE_TYPES, getSection } from '../utils/practiceStructure'
import { saveCustomPractice, generateCustomPracticeSlug } from '../state/customPracticeStore'
import PracticeBuilderSection from './PracticeBuilderSection'

function PracticeBuilder() {
  const navigate = useNavigate()
  const [state, actions] = usePracticeBuilder()
  const [activeSectionKey, setActiveSectionKey] = useState('tuningIn')
  const [practiceName, setPracticeName] = useState('')
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false)

  const composition = validatePracticeComposition(state)
  const allSelectedIds = Object.values(state.sections).flat()

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

  function handleSelectType(practiceType) {
    actions.setPracticeType(practiceType)
    setActiveSectionKey('tuningIn')
  }

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

  function handleSave() {
    setHasAttemptedSave(true)

    if (!canSave) return

    const slug = generateCustomPracticeSlug()
    const orderedSlugs = assemblePracticeOrder(state, modules)

    saveCustomPractice({
      id: slug,
      slug,
      title: practiceName.trim(),
      chineseTitle: practiceName.trim(),
      difficulty: 'Beginner',
      description: '由學員自由組課建立的 Practice。',
      isCustom: true,
      modules: orderedSlugs
    })

    navigate(`/practices/${slug}`)
  }

  if (!state.practiceType) {
    return (
      <div className="practice-builder">
        <h1>建立新課程</h1>
        <p className="section-description">選擇要建立的 Practice 類型。</p>

        <div className="builder-type-choices">
          <button type="button" className="card" onClick={() => handleSelectType(PRACTICE_TYPES.FULL)}>
            <h3>完整練習 Full Practice</h3>
            <p>包含 Asana Module，是最主要的課程形式。</p>
          </button>

          <button type="button" className="card" onClick={() => handleSelectType(PRACTICE_TYPES.MEDITATION)}>
            <h3>冥想練習 Meditation Practice</h3>
            <p>不包含 Asana Module，適合呼吸與冥想為主的練習。</p>
          </button>
        </div>
      </div>
    )
  }

  const sections = sectionsForPracticeType(state.practiceType)

  return (
    <div className="practice-builder">
      <h1>建立新課程</h1>

      <p className="section-description">
        目前類型：{state.practiceType === PRACTICE_TYPES.FULL ? '完整練習 Full Practice' : '冥想練習 Meditation Practice'}
        {' '}
        <button type="button" className="link-button" onClick={() => actions.setPracticeType(null)}>
          變更類型
        </button>
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

          return (
            <PracticeBuilderSection
              key={sectionConfig.key}
              result={result}
              moduleIds={state.sections[sectionConfig.key]}
              modules={modules}
              allSelectedIds={allSelectedIds}
              moduleSectionLabels={moduleSectionLabels}
              capabilityNote={capabilityNote}
              isExpanded={isExpanded}
              onToggle={() => setActiveSectionKey(isExpanded ? null : sectionConfig.key)}
              onAdd={(moduleId) => handleAdd(sectionConfig, moduleId)}
              onRemove={(moduleId) => actions.removeModule(sectionConfig.key, moduleId)}
              onMove={(moduleId, direction) => actions.moveModule(sectionConfig.key, moduleId, direction)}
              relaxationPositionControl={relaxationPositionControl}
            />
          )
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
