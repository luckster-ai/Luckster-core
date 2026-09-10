import { Link } from 'react-router-dom'
import { formatVideoDuration } from '../utils/formatDuration'

// Module Library cleanup (2026-09): renders its own self-linking `.card`,
// the same working shape as FoundationCard.jsx / PracticeCard.jsx.
// ModuleLibrary.jsx previously wrapped this in <Link className="card-link">
// -- a class with no CSS rule anywhere -- so every card rendered as
// unstyled blue underlined text (the identical bug already fixed for the
// Foundation and Practice cards). Chinese title leads, English title is
// the subtitle, matching those two cards.
function ModuleCard({ module }) {
  return (
    <Link to={`/modules/${module.slug}`} className="card">
      <h3>{module.chineseTitle}</h3>

      <p className="module-playback-subtitle">{module.title}</p>

      <p>影片時長：{formatVideoDuration(module.duration)}</p>

      <p>類別：{module.categories.join('、')}</p>

      <p>{module.summary}</p>
    </Link>
  )
}

export default ModuleCard
