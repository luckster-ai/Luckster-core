import practices from '../data/practices'
import { getAllCustomPractices } from '../state/customPracticeStore'
import { isPublished } from '../utils/practiceLifecycle'
import PracticeHub from '../components/PracticeHub'

function PracticeHubPage() {
  const officialPractices = practices.filter(isPublished)
  const customPractices = getAllCustomPractices()

  return (
    <PracticeHub officialPractices={officialPractices} customPractices={customPractices} />
  )
}

export default PracticeHubPage
