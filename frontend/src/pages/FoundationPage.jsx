import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import foundations from '../data/foundations'
import formatDuration from '../utils/formatDuration'

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
        <strong>Duration：</strong> {formatDuration(foundation.duration)}
      </p>

      <p>{foundation.description}</p>

      {foundation.videoReference && (
        <p>
          <a
            href={foundation.videoReference}
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