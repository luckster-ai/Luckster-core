import { Link } from 'react-router-dom'
import { formatVideoDuration } from '../utils/formatDuration'

function FoundationCard({ foundation }) {
  return (
    <div className="card">
      <h3>{foundation.title}</h3>

      <p>{foundation.difficulty}</p>

      <p>影片時長：{formatVideoDuration(foundation.duration)}</p>

      <p>{foundation.summary}</p>

      <Link
        to={`/foundations/${foundation.slug}`}
        className="button"
      >
        開始學習
      </Link>
    </div>
  )
}

export default FoundationCard