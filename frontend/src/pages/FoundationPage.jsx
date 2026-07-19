import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import foundations from '../data/foundations'

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
        <strong>Level：</strong> {foundation.level}
      </p>

      <p>
        <strong>Duration：</strong> {foundation.duration}
      </p>

      <p>{foundation.summary}</p>

      {foundation.youtube && (
        <p>
          <a
            href={foundation.youtube}
            target="_blank"
            rel="noreferrer"
          >
            前往 YouTube 觀看
          </a>
        </p>
      )}

      <p>
        <strong>完成狀態：</strong>{' '}
        {foundation.completed ? '✅ 已完成' : '⬜ 尚未完成'}
      </p>

      <hr />

      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}

export default FoundationPage