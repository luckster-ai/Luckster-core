import { Link } from 'react-router-dom'
import { formatVideoDuration } from '../utils/formatDuration'

// Phase 6D: Official Practices no longer carry their own long-form notes
// (no Practice Notes CMS). Practice Detail's per-step content is each
// Module's own `summary` (data/modules.js), shown in playback order --
// the same short description ModulePage.jsx renders. Custom Practices get
// it here too, for free.
function PracticeStep({ module, order }) {
  return (
    <li className="practice-step">
      <span className="practice-step-order">{order}</span>

      <Link to={`/modules/${module.slug}`}>
        {module.chineseTitle}
      </Link>

      <p>影片時長：{formatVideoDuration(module.duration)}</p>

      {module.summary && <p className="practice-step-summary">{module.summary}</p>}
    </li>
  )
}

export default PracticeStep
