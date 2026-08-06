import { useParams } from 'react-router-dom'
import foundations from '../data/foundations'
import { getMarkdown } from '../utils/foundationContent'
import LessonDetail from '../components/LessonDetail'
import FoundationOverview from '../components/FoundationOverview'

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

  if (foundation.lessons.length === 1) {
    const markdown = getMarkdown(`../content/foundations/${slug}.md`)

    return (
      <div className="foundation-page">
        <LessonDetail lesson={foundation.lessons[0]} markdown={markdown} />
      </div>
    )
  }

  const markdown = getMarkdown(`../content/foundations/${slug}/${slug}.md`)

  return (
    <div className="foundation-page">
      <FoundationOverview foundation={foundation} markdown={markdown} />
    </div>
  )
}

export default FoundationPage
