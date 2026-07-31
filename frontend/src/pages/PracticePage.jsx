import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import practices from '../data/practices'
import modules from '../data/modules'
import formatDuration from '../utils/formatDuration'
import { calculatePracticeDuration } from '../utils/calculatePracticeDuration'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import PracticeStep from '../components/PracticeStep'

const markdownModules = import.meta.glob(
  '../content/practices/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

function PracticePage() {
  const { slug } = useParams()

  const practice = practices.find(
    (item) => item.slug === slug
  )

  if (!practice) {
    return (
      <div className="practice-page">
        <h1>找不到課程</h1>
        <p>此 Practice 不存在。</p>
      </div>
    )
  }

  const markdownPath = `../content/practices/${slug}.md`
  const markdown = markdownModules[markdownPath] || ''

  const orderedModules = resolvePracticeModules(practice, modules)
  const totalDuration = calculatePracticeDuration(practice, modules)

  return (
    <div className="practice-page">
      <section className="practice-header">
        <h1>{practice.chineseTitle}</h1>

        <p className="module-playback-subtitle">{practice.title}</p>

        <p>
          <strong>Level：</strong> {practice.difficulty}
        </p>

        <p>
          <strong>Duration：</strong> {formatDuration(totalDuration)}
        </p>

        <p>{practice.description}</p>

        <Link to={`/practices/${slug}/play`} className="button">
          開始練習
        </Link>
      </section>

      <section className="practice-sequence-section">
        <h2>今日練習 Today's Practice</h2>

        <ol className="practice-sequence">
          {orderedModules.map((module, index) => (
            <PracticeStep
              key={module.slug}
              module={module}
              order={index + 1}
            />
          ))}
        </ol>
      </section>

      <section className="practice-notes">
        <h2>練習筆記 Practice Notes</h2>

        <ReactMarkdown>{markdown}</ReactMarkdown>
      </section>
    </div>
  )
}

export default PracticePage
