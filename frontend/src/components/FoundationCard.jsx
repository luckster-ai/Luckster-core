import { Link } from 'react-router-dom'
import { formatVideoDuration } from '../utils/formatDuration'

function FoundationCard({ foundation }) {
  const isSingleLesson = foundation.lessons.length === 1
  const primaryLesson = foundation.lessons[0]

  return (
    <Link to={`/foundations/${foundation.slug}`} className="card">
      <h3>{foundation.chineseTitle}</h3>

      <p className="module-playback-subtitle">{foundation.title}</p>

      {isSingleLesson ? (
        <>
          <p>影片時長：{formatVideoDuration(primaryLesson.duration)}</p>

          <p>{primaryLesson.summary}</p>
        </>
      ) : (
        <>
          <p>{foundation.lessons.length} 個課程</p>

          <p>{foundation.summary}</p>
        </>
      )}
    </Link>
  )
}

export default FoundationCard