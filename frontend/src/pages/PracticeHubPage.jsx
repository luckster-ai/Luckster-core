import { getAllCustomPractices } from '../state/customPracticeStore'
import { useOfficialPractices } from '../hooks/useOfficialPractices'
import PracticeHub from '../components/PracticeHub'

// Phase 6D: Official Practices come solely from Supabase
// (useOfficialPractices, the single runtime source of truth). Custom
// Practices stay on this device's localStorage, unchanged.
function PracticeHubPage() {
  const { practices: officialPractices, loading, error } = useOfficialPractices()
  const customPractices = getAllCustomPractices()

  return (
    <PracticeHub
      officialPractices={officialPractices}
      customPractices={customPractices}
      officialLoading={loading}
      officialError={error}
    />
  )
}

export default PracticeHubPage
