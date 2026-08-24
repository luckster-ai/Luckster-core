import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'
import { formatVideoDuration } from '../utils/formatDuration'

// Shared "selected Module" detail card. Extracted from
// PracticeSectionCanvas.jsx (pure refactor, no behavior change there) so
// the Mobile Practice Builder's Module Selection panel
// (MobileModulePanel.jsx) can reuse the exact same presentation instead
// of duplicating it — both render the identical piece-card markup/CSS,
// just inside different Mobile/Tablet containers. See
// utils/sectionStatusLabel.js for the other shared piece (kept in its
// own file since it's a plain function, not a component).
export function PieceCard({ module, index, total, onRemove, onMove }) {
  const thumbnailUrl = getModuleThumbnailUrl(module)

  return (
    <li className="piece-card">
      <div className="piece-card-image">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={module.chineseTitle} loading="lazy" />
        ) : (
          <div className="piece-card-image-fallback" aria-hidden="true">{module.chineseTitle.slice(0, 1)}</div>
        )}
      </div>

      <div className="piece-card-body">
        <p className="piece-card-title">{module.chineseTitle}</p>
        <p className="piece-card-meta">
          {module.subcategory ? `${module.subcategory} · ` : ''}{formatVideoDuration(module.duration)}
        </p>

        <div className="piece-card-controls">
          <button
            type="button"
            onClick={() => onMove(module.id, 'up')}
            disabled={index === 0}
            aria-label="上移"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(module.id, 'down')}
            disabled={index === total - 1}
            aria-label="下移"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => onRemove(module.id)}
            aria-label="移除"
          >
            ✕
          </button>
        </div>
      </div>
    </li>
  )
}
