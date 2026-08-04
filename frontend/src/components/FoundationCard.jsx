import { Link } from 'react-router-dom'
import { formatVideoDuration } from '../utils/formatDuration'

function FoundationCard({ foundation }) {
  return (
    <Link to={`/foundations/${foundation.slug}`} className="card">
      <h3>{foundation.chineseTitle}</h3>

      <p className="module-playback-subtitle">{foundation.title}</p>

      <p>影片時長：{formatVideoDuration(foundation.duration)}</p>

      <p>{foundation.summary}</p>
    </Link>
  )
}

export default FoundationCard