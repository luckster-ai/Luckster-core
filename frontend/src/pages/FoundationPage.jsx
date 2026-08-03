import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import foundations from '../data/foundations'
import { formatVideoDuration } from '../utils/formatDuration'

const markdownModules = import.meta.glob(
  '../content/foundations/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

function FoundationPage() {
  const { slug } = useParams()

  const foundation = foundations.find(
    (item) => item.slug === slug
  )

  if (!foundation) {
    return (
      <div className="foundation-page">
        <h1>找不到課程</h1>
        <p>此 Foundation 不存在。</p>
      </div>
    )
  }

  const markdownPath = `../content/foundations/${slug}.md`
  const markdown = markdownModules[markdownPath] || ''

  return (
    <div className="foundation-page">
      <h1>{foundation.title}</h1>

      <p>
        <strong>Level：</strong> {foundation.difficulty}
      </p>

      <p>
        <strong>影片時長：</strong> {formatVideoDuration(foundation.duration)}
      </p>

      <p>{foundation.summary}</p>

      {foundation.videoReference?.videoId && (
        <p>
          <a
            href={`https://www.youtube.com/watch?v=${foundation.videoReference.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            前往 YouTube 觀看
          </a>
        </p>
      )}

      <hr />

      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}

export default FoundationPage