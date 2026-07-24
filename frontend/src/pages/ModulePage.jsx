import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import modules from '../data/modules'
import formatDuration from '../utils/formatDuration'

const markdownModules = import.meta.glob(
  '../content/modules/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

function ModulePage() {
  const { slug } = useParams()

  const module = modules.find(
    (item) => item.slug === slug
  )

  if (!module) {
    return (
      <div className="module-page">
        <h1>找不到課程</h1>
        <p>此 Module 不存在。</p>
      </div>
    )
  }

  const markdownPath = `../content/modules/${slug}.md`
  const markdown = markdownModules[markdownPath] || ''

  return (
    <div className="module-page">
      <h1>{module.title}</h1>

      <p>
        <strong>Level：</strong> {module.difficulty}
      </p>

      <p>
        <strong>Duration：</strong> {formatDuration(module.duration)}
      </p>

      <p>{module.description}</p>

      {module.videoReference && (
        <p>
          <a
            href={module.videoReference}
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

export default ModulePage
