import modules from '../data/modules'
import { calculatePracticeDuration } from '../utils/calculatePracticeDuration'
import formatDuration from '../utils/formatDuration'

export default function PracticeCard({ practice }) {
  const totalDuration = calculatePracticeDuration(
    practice,
    modules
  )

  return (
    <div className="practice-card">
      <h3>{practice.chineseTitle}</h3>

      <p>{practice.title}</p>

      <p>
        <strong>難度：</strong>
        {practice.difficulty}
      </p>

      <p>
        <strong>時長：</strong>
        {formatDuration(totalDuration)}
      </p>

      <p>{practice.description}</p>
    </div>
  )
}