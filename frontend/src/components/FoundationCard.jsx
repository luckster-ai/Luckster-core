import { Link } from 'react-router-dom'
import { formatVideoDuration } from '../utils/formatDuration'

// Shares the card text hierarchy with PracticeCard (see .card-duration /
// .card-description in App.css): centered title, English title and
// duration (or lesson count); left-aligned description.
function FoundationCard({ foundation }) {
  const isSingleLesson = foundation.lessons.length === 1
  const summary = isSingleLesson ? foundation.lessons[0].summary : foundation.summary

  return (
    <Link to={`/foundations/${foundation.slug}`} className="card foundation-card">
      <h3>{foundation.chineseTitle}</h3>

      <p className="module-playback-subtitle">{foundation.title}</p>

      {/* A multi-lesson entry shows its lesson count (no summed duration)
          in the duration's place, so visitors know another level follows. */}
      <p className="card-duration">
        {isSingleLesson
          ? `影片時長：${formatVideoDuration(foundation.lessons[0].duration)}`
          : `${foundation.lessons.length} 個課程`}
      </p>

      {summary && <p className="card-description">{summary}</p>}
    </Link>
  )
}

export default FoundationCard