import { Link } from 'react-router-dom'
import formatDuration from '../utils/formatDuration'

function FoundationCard({ foundation }) {
  return (
    <div className="card">
      <h3>{foundation.title}</h3>

      <p>{foundation.difficulty}</p>

      <p>{formatDuration(foundation.duration)}</p>

      <p>{foundation.description}</p>

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