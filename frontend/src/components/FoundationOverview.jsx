import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { formatVideoDuration } from '../utils/formatDuration'
import { stripMarkdownSection } from '../utils/stripMarkdownSection'

function toFoundationOverviewContent(markdown) {
  let result = markdown.replace(/^#\s+.+\n+/, '')
  result = stripMarkdownSection(result, '##\\s*Basic Information')
  result = stripMarkdownSection(result, '##\\s*Summary')
  result = stripMarkdownSection(result, '##\\s*Lessons')
  return result
}

function FoundationOverview({ foundation, markdown }) {
  const overviewContent = toFoundationOverviewContent(markdown)

  return (
    <>
      <h1>{foundation.chineseTitle}</h1>

      <p className="module-playback-subtitle">{foundation.title}</p>

      <p>{foundation.summary}</p>

      <ReactMarkdown>{overviewContent}</ReactMarkdown>

      <h2>課程列表 Lessons</h2>

      <div className="cards">
        {foundation.lessons.map((lesson) => (
          <Link
            key={lesson.slug}
            to={`/foundations/${foundation.slug}/${lesson.slug}`}
            className="card"
          >
            <h3>{lesson.chineseTitle}</h3>

            <p className="module-playback-subtitle">{lesson.title}</p>

            <p>影片時長：{formatVideoDuration(lesson.duration)}</p>

            <p>{lesson.summary}</p>
          </Link>
        ))}
      </div>
    </>
  )
}

export default FoundationOverview
