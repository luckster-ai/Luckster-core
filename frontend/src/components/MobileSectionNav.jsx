import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'

// Mobile Practice Builder — reference-02/03 "Module Selection" state's
// compact Section strip. Sits beside/above the large Module Picker
// (MobileModulePanel.jsx) and stays visible the entire time a Section is
// active — there is no "back to overview" action, tapping the currently
// active card here just calls its own onToggle again, which returns
// activeSectionKey to null (see PracticeBuilder.jsx), naturally landing
// back on MobileSectionOverview. A 3-column grid so all six stay visible
// without horizontal scrolling, smaller than the Overview grid's own
// cards since this is secondary navigation once the Picker becomes the
// primary work area. Mobile-only — see .mobile-nav-grid in App.css.
const NAV_THUMBNAIL_CAP = 2

function NavThumbnails({ sectionModules }) {
  const shown = sectionModules.slice(0, NAV_THUMBNAIL_CAP)
  const overflow = sectionModules.length - shown.length

  return (
    <span className="mobile-nav-thumbs">
      {shown.map((module) => {
        const thumbnailUrl = getModuleThumbnailUrl(module)

        return (
          <span className="mobile-nav-thumb" key={module.id}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="" loading="lazy" />
            ) : (
              <span className="mobile-nav-thumb-fallback" aria-hidden="true">
                {module.chineseTitle.slice(0, 1)}
              </span>
            )}
          </span>
        )
      })}

      {overflow > 0 && <span className="mobile-nav-thumb mobile-nav-thumb-more">+{overflow}</span>}
    </span>
  )
}

function MobileSectionNav({ sectionsData, modules }) {
  return (
    <div className="mobile-nav-grid" role="tablist" aria-label="Section 導覽">
      {sectionsData.map(({ sectionConfig, result, moduleIds, isExpanded, onToggle }) => {
        const sectionModules = moduleIds
          .map((id) => modules.find((module) => module.id === id))
          .filter(Boolean)
        const zhLabel = sectionConfig.label.split(' ')[0]

        return (
          <button
            type="button"
            key={sectionConfig.key}
            role="tab"
            aria-selected={isExpanded}
            className={`mobile-nav-item mobile-nav-item--${sectionConfig.key}${isExpanded ? ' mobile-nav-item--active' : ''}`}
            onClick={onToggle}
          >
            <span className="zh">{zhLabel}</span>
            <span className="mobile-nav-count">{result.count} 部</span>

            {sectionModules.length > 0 && <NavThumbnails sectionModules={sectionModules} />}
          </button>
        )
      })}
    </div>
  )
}

export default MobileSectionNav
