import practices from '../data/practices'
import { getAllCustomPractices } from '../state/customPracticeStore'
import PracticeHub from '../components/PracticeHub'

function PracticeHubPage() {
  const customPractices = getAllCustomPractices()

  return (
    <PracticeHub officialPractices={practices} customPractices={customPractices} />
  )
}

export default PracticeHubPage
