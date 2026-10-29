import { Link } from 'react-router-dom'
import modules from '../data/modules'
import { calculatePracticeDuration } from '../utils/calculatePracticeDuration'
import { formatVideoDuration } from '../utils/formatDuration'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'

// Sprint 2A: renders its own Link directly, following the same working
// pattern as FoundationCard.jsx / ModuleCard.jsx (an anchor carrying the
// existing, already-styled `.card` class). The Practice Hub audit found
// the previous approach -- PracticeHub.jsx wrapping this card in a
// separate `<Link className="card-link">` -- had no matching CSS at
// all, so it rendered as an unstyled block of default blue underlined
// text. Matching the already-correct FoundationCard/ModuleCard shape is
// the fix, not inventing a new card pattern.
//
// Thumbnail: no Practice-specific image field exists in the data model,
// and this Sprint does not add one (see the Sprint 2A brief's Image/
// Asset rule). Instead this reuses the same real-data-derived strategy
// already established for Modules (getModuleThumbnailUrl, from Sprint
// 1A) against the Practice's first resolved Module -- a real thumbnail
// from real repository data, not an invented asset.
// Difficulty as a one-character badge in the card's top-right corner.
// Values without a label (none, or an unknown one) show no badge.
const DIFFICULTY_LABELS = { Beginner: '初', Intermediate: '中', Advanced: '高' }

function PracticeCard({ practice, isCustom, resumable }) {
  const totalDuration = calculatePracticeDuration(practice, modules)
  const orderedModules = resolvePracticeModules(practice, modules)
  const thumbnailUrl = orderedModules[0] ? getModuleThumbnailUrl(orderedModules[0]) : null
  const difficultyLabel = DIFFICULTY_LABELS[practice.difficulty]

  return (
    <Link to={`/practices/${practice.slug}`} className="card practice-card">
      {difficultyLabel && (
        <span className="practice-card-level" aria-label={`難度：${difficultyLabel}`} title={`難度：${difficultyLabel}`}>
          {difficultyLabel}
        </span>
      )}

      <div className="practice-card-image">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={practice.chineseTitle} loading="lazy" />
        ) : (
          <div className="practice-card-image-fallback" aria-hidden="true">{practice.chineseTitle.slice(0, 1)}</div>
        )}
      </div>

      {isCustom && <span className="practice-card-badge">你建立的練習</span>}
      {resumable && <span className="practice-card-badge practice-card-badge--resume">未完成，可繼續</span>}

      <h3>{practice.chineseTitle}</h3>

      <p className="card-duration">影片時長：{formatVideoDuration(totalDuration)}</p>

      {practice.description && (
        <p className="card-description">{practice.description}</p>
      )}
    </Link>
  )
}

export default PracticeCard
