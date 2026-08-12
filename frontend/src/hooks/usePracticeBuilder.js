import { useMemo, useState } from 'react'
import { createEmptyBuilderState, isModuleAlreadyInPractice } from '../utils/validatePracticeBuilder'
import { getSection } from '../utils/practiceStructure'

// Builder state is intentionally plain data (see createEmptyBuilderState),
// independent of any visual/styling concern, so a future Visual Identity
// pass can restyle the Builder without touching this state or its rules.
export function usePracticeBuilder() {
  const [state, setState] = useState(createEmptyBuilderState)

  const actions = useMemo(
    () => ({
      setPracticeType(practiceType) {
        setState((current) => ({
          ...current,
          practiceType,
          // Asana never applies to Meditation Practice; clear it if the
          // learner switches type after having selected one.
          sections:
            practiceType === 'meditation'
              ? { ...current.sections, asana: [] }
              : current.sections
        }))
      },

      setRelaxationPosition(position) {
        setState((current) => ({ ...current, relaxationPosition: position }))
      },

      addModule(sectionKey, moduleId) {
        setState((current) => {
          if (isModuleAlreadyInPractice(current, moduleId)) {
            return current
          }

          const section = getSection(sectionKey)
          const currentIds = current.sections[sectionKey]

          // Mirrors the UI's own gate (Picker hides once count reaches max)
          // at the state layer, so max is enforced regardless of call path.
          if (section && currentIds.length >= section.max) {
            return current
          }

          return {
            ...current,
            sections: {
              ...current.sections,
              [sectionKey]: [...currentIds, moduleId]
            }
          }
        })
      },

      removeModule(sectionKey, moduleId) {
        setState((current) => ({
          ...current,
          sections: {
            ...current.sections,
            [sectionKey]: current.sections[sectionKey].filter((id) => id !== moduleId)
          }
        }))
      },

      moveModule(sectionKey, moduleId, direction) {
        setState((current) => {
          const ids = current.sections[sectionKey]
          const index = ids.indexOf(moduleId)
          const targetIndex = direction === 'up' ? index - 1 : index + 1

          if (index === -1 || targetIndex < 0 || targetIndex >= ids.length) {
            return current
          }

          const next = [...ids]
          ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]

          return {
            ...current,
            sections: { ...current.sections, [sectionKey]: next }
          }
        })
      },

      reset() {
        setState(createEmptyBuilderState())
      }
    }),
    []
  )

  return [state, actions]
}
