import { useParams } from 'react-router-dom'
import practices from '../data/practices'
import modules from '../data/modules'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import PracticePlayer from '../components/PracticePlayer'

function PracticePlayerPage() {
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

  const orderedModules = resolvePracticeModules(practice, modules)

  return (
    <PracticePlayer practice={practice} modules={orderedModules} />
  )
}

export default PracticePlayerPage
