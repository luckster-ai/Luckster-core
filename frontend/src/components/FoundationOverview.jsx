import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { formatVideoDuration } from '../utils/formatDuration'
import { getMarkdownSection } from '../utils/stripMarkdownSection'

// Multi-lesson Foundation page (基本坐姿 / 練習環境與裝備 / 基本的手印).
// Top area: Chinese title, one English title, the longer Description
// (left-aligned), then 課程列表. The short Summary is left out on purpose
// -- the entry card on /foundations already shows it -- and so is 先備條件,
// which each video page (LessonDetail.jsx) shows instead. Lesson cards
// reuse the /foundations card format (FoundationCard.jsx).
function FoundationOverview({ foundation, markdown }) {
  const description = getMarkdownSection(markdown, 'Description')

  return (
    <>
      {/* Phones only -- on desktop the header's 新手必修 link is visible. */}
      <Link to="/foundations" className="practice-player-exit back-mobile-only">
        ← 返回新手必修列表
      </Link>

      <h1 className="foundation-page-title">{foundation.chineseTitle}</h1>

      <p className="module-playback-subtitle">{foundation.title}</p>

      {description && (
        <div className="foundation-overview-description">
          <ReactMarkdown>{description}</ReactMarkdown>
        </div>
      )}

      <h2 className="foundation-overview-lessons-title">課程列表</h2>

      <div className="cards">
        {foundation.lessons.map((lesson) => (
          <Link
            key={lesson.slug}
            to={`/foundations/${foundation.slug}/${lesson.slug}`}
            className="card foundation-card"
          >
            <h3>{lesson.chineseTitle}</h3>

            <p className="module-playback-subtitle">{lesson.title}</p>

            <p className="card-duration">影片時長：{formatVideoDuration(lesson.duration)}</p>

            {lesson.summary && <p className="card-description">{lesson.summary}</p>}
          </Link>
        ))}
      </div>
    </>
  )
}

export default FoundationOverview
