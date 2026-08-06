import { useParams, Link } from 'react-router-dom'
import foundations from '../data/foundations'
import { getMarkdown } from '../utils/foundationContent'
import LessonDetail from '../components/LessonDetail'

function LessonPage() {
  const { slug, lessonSlug } = useParams()

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

  const lesson = foundation.lessons.find(
    (item) => item.slug === lessonSlug
  )

  if (!lesson) {
    return (
      <div className="foundation-page">
        <h1>找不到課程</h1>
        <p>此 Lesson 不存在。</p>
      </div>
    )
  }

  const markdown = getMarkdown(
    `../content/foundations/${slug}/${lessonSlug}.md`
  )

  return (
    <div className="foundation-page">
      <Link to={`/foundations/${slug}`} className="practice-player-exit">
        ← 返回 {foundation.chineseTitle}
      </Link>

      <LessonDetail lesson={lesson} markdown={markdown} />
    </div>
  )
}

export default LessonPage
