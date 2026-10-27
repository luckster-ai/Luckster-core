import { useSearchParams } from 'react-router-dom'
import PracticeBuilder from '../components/PracticeBuilder'
import { useCustomPractices } from '../state/customPracticeStore'

// PracticeBuilder reads the Practice being edited once, on mount. When
// editing (?edit=slug), wait until the member's Custom Practices have
// loaded (Website Refinement M8b) so a Practice saved on another device
// is not opened as a blank Builder.
function PracticeBuilderPage() {
  const [searchParams] = useSearchParams()
  const { ready } = useCustomPractices()

  if (searchParams.get('edit') && !ready) {
    return (
      <div className="practice-page">
        <p>載入中…</p>
      </div>
    )
  }

  return (
    <PracticeBuilder />
  )
}

export default PracticeBuilderPage
