import { Link } from 'react-router-dom'
import { formatVideoDuration } from '../utils/formatDuration'

function PracticeStep({ module, order }) {
  return (
    <li className="practice-step">
      <span className="practice-step-order">{order}</span>

      <Link to={`/modules/${module.slug}`}>
        {module.chineseTitle}
      </Link>

      <p>影片時長：{formatVideoDuration(module.duration)}</p>
    </li>
  )
}

export default PracticeStep
