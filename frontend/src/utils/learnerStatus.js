export const LEARNER_STATUS = {
  NOT_STARTED: 'not_started',
  COMPLETED: 'completed',
  ALREADY_LEARNED: 'already_learned'
}

export function getLearnerStatus(learnerStatusMap, id) {
  return learnerStatusMap[id] || LEARNER_STATUS.NOT_STARTED
}

export function isPrerequisiteSatisfied(learnerStatusMap, id) {
  const status = getLearnerStatus(learnerStatusMap, id)

  return (
    status === LEARNER_STATUS.COMPLETED ||
    status === LEARNER_STATUS.ALREADY_LEARNED
  )
}

export function getMissingPrerequisites(prerequisites, learnerStatusMap) {
  return prerequisites.filter(
    (item) => !isPrerequisiteSatisfied(learnerStatusMap, item.id)
  )
}
