import { Link } from 'react-router-dom'
import formatDuration from '../utils/formatDuration'

function PracticeStep({ module, order }) {
  return (
    <li className="practice-step">
      <span className="practice-step-order">{order}</span>

      <Link to={`/modules/${module.slug}`}>
        {module.title}
      </Link>

      <p>{formatDuration(module.duration)}</p>
    </li>
  )
}

export default PracticeStep
