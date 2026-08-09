import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { formatVideoDuration } from '../utils/formatDuration'
import { stripMarkdownSection, stripSectionIfEmpty } from '../utils/stripMarkdownSection'

function toFoundationOverviewContent(markdown) {
  let result = markdown.replace(/^#\s+.+\n+/, '')
  result = stripMarkdownSection(result, '##\\s*Basic Information')
  result = stripMarkdownSection(result, '##\\s*Summary')
  result = stripMarkdownSection(result, '##\\s*Lessons')
  result = stripMarkdownSection(result, '##\\s*Tags')
  result = stripMarkdownSection(result, '###\\s*Video')
  result = stripSectionIfEmpty(result, '###\\s*Transcript')
  result = stripSectionIfEmpty(result, '###\\s*Resources')
  result = stripSectionIfEmpty(result, '##\\s*Sources')
  return result
}

function FoundationOverview({ foundation, markdown }) {
  const overviewContent = toFoundationOverviewContent(markdown)

  return (
    <>
      <Link to="/foundations" className="practice-player-exit">
        ← 返回新手必修列表
      </Link>

      <h1>{foundation.chineseTitle}</h1>

      <p className="module-playback-subtitle">{foundation.title}</p>

      <p>{foundation.summary}</p>

      <ReactMarkdown>{overviewContent}</ReactMarkdown>

      <h2>課程列表 Lessons</h2>

      <div className="cards">
        {foundation.lessons.map((lesson, index) => (
          <Link
            key={lesson.slug}
            to={`/foundations/${foundation.slug}/${lesson.slug}`}
            className="card"
          >
            <p className="module-playback-subtitle">第 {index + 1} 課</p>

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
