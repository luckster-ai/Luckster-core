import { useCustomPractices } from '../state/customPracticeStore'
import { useOfficialPractices } from '../hooks/useOfficialPractices'
import PracticeHub from '../components/PracticeHub'

// Phase 6D: Official Practices come solely from Supabase
// (useOfficialPractices, the single runtime source of truth). Custom
// Practices come from useCustomPractices() (Supabase for signed-in
// members, localStorage for visitors -- Website Refinement M8b).
function PracticeHubPage() {
  const { practices: officialPractices, loading, error } = useOfficialPractices()
  const { practices: customPractices } = useCustomPractices()

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
