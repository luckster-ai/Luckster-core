import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'

// Mobile Practice Builder — reference-01 "Overview" state. A 2-column
// grid so all six Sections fit within one ~390px viewport without
// scrolling (the hard requirement) while each card stays a comfortable,
// tappable size (not compressed to the point of being hard to use).
// Mobile-only — see .mobile-overview-grid in App.css, scoped to
// max-width:767px. Desktop/Tablet render their own existing grid
// (.overview-grid / WorkbenchColumn) and are untouched by this file.
const OVERVIEW_THUMBNAIL_CAP = 3

function OverviewThumbnails({ sectionModules }) {
  const shown = sectionModules.slice(0, OVERVIEW_THUMBNAIL_CAP)
  const overflow = sectionModules.length - shown.length

  return (
    <ul className="mobile-overview-thumbs">
      {shown.map((module) => {
        const thumbnailUrl = getModuleThumbnailUrl(module)

        return (
          <li className="mobile-overview-thumb" key={module.id}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" loading="lazy" />
            ) : (
              <span className="mobile-overview-thumb-fallback" aria-hidden="true">
                {module.chineseTitle.slice(0, 1)}
              </span>
            )}
          </li>
        )
      })}

      {overflow > 0 && (
        <li className="mobile-overview-thumb mobile-overview-thumb-more" aria-label={`還有 ${overflow} 部影片`}>
          +{overflow}
        </li>
      )}
    </ul>
  )
}

function MobileSectionOverview({ sectionsData, modules }) {
  return (
    <div className="mobile-overview-grid">
      {sectionsData.map(({ sectionConfig, result, moduleIds, onToggle }) => {
        const sectionModules = moduleIds
          .map((id) => modules.find((module) => module.id === id))
          .filter(Boolean)
        const zhLabel = sectionConfig.label.split(' ')[0]
        const hasSelected = sectionModules.length > 0

        return (
          <div
            key={sectionConfig.key}
            className={`mobile-overview-card mobile-overview-card--${sectionConfig.key}`}
            role="button"
            tabIndex={0}
            onClick={onToggle}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onToggle()
              }
            }}
          >
            <span className="zh">{zhLabel}</span>
            <span className="mobile-overview-count">{result.count} 部</span>
            <span className="mobile-overview-divider" aria-hidden="true" />

            {hasSelected ? (
              <OverviewThumbnails sectionModules={sectionModules} />
            ) : (
              <span className="mobile-overview-add">＋ 加入影片</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default MobileSectionOverview
