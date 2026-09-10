import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getModuleAvailability, groupModulesBySubcategory } from '../utils/validatePracticeBuilder'
import { getModuleThumbnailUrl } from '../utils/moduleThumbnail'
import { formatVideoDuration } from '../utils/formatDuration'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus } from '../utils/membershipStatus'
import { getModuleCapSeconds } from '../utils/playbackEntitlement'
import VideoPlayer from './VideoPlayer'

// Picker presentation for the Stage 1A UX slice (Warm Up only). Filtering
// and eligibility are unchanged from ModulePicker.jsx (same Category
// filter, same-section exclusion, same groupModulesBySubcategory /
// getModuleAvailability calls) -- only the visual output differs, per the
// approved B+A hybrid direction. ModulePicker.jsx itself is untouched and
// still serves every other section.
//
// Module Preview (2026-09): each candidate card has a "預覽 / 詳細"
// toggle. Expanding shows the Module's own fields (titles, difficulty,
// duration, category, subcategory, tags, summary -- no .md load) plus the
// full Module video via the shared <VideoPlayer>, entitlement-capped
// exactly like /modules and the Practice runtime (getModuleCapSeconds ->
// capSeconds). The toggle is local per-card state only: it never touches
// Builder composition state, the active section, or the add/remove flow.
// Collapsing unmounts <VideoPlayer>. Shared by both the Custom Practice
// Builder and the Admin Official Practice Builder (both render this exact
// component).
function PickerPieceCard({ module, disabled, reason, onAdd, membershipStatus }) {
  const thumbnailUrl = getModuleThumbnailUrl(module)
  const [expanded, setExpanded] = useState(false)
  const [showCappedNotice, setShowCappedNotice] = useState(false)

  const capSeconds = getModuleCapSeconds({
    membershipStatus,
    provider: module.videoReference?.provider
  })

  return (
    <li className={`piece-card piece-card--picker${disabled ? ' disabled' : ''}${expanded ? ' expanded' : ''}`}>
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

        <button
          type="button"
          className="piece-card-preview-toggle"
          aria-expanded={expanded}
          onClick={() => {
            setExpanded((value) => !value)
            setShowCappedNotice(false)
          }}
        >
          {expanded ? '收起預覽' : '預覽 / 詳細'}
        </button>

        <button
          type="button"
          className="piece-card-add"
          disabled={disabled}
          onClick={() => onAdd(module.id)}
        >
          {disabled ? reason : '＋ 加入'}
        </button>
      </div>

      {expanded && (
        <div className="piece-card-preview">
          <p className="piece-card-preview-title">{module.chineseTitle}</p>
          <p className="module-playback-subtitle">{module.title}</p>

          <dl className="piece-card-preview-meta">
            <div>
              <dt>難度</dt>
              <dd>{module.difficulty}</dd>
            </div>
            <div>
              <dt>時長</dt>
              <dd>{formatVideoDuration(module.duration)}</dd>
            </div>
            <div>
              <dt>類別</dt>
              <dd>{module.categories.join('、')}</dd>
            </div>
            {module.subcategory && (
              <div>
                <dt>子類別</dt>
                <dd>{module.subcategory}</dd>
              </div>
            )}
          </dl>

          {module.tags?.length > 0 && (
            <p className="piece-card-preview-tags">標籤：{module.tags.join('、')}</p>
          )}

          {module.summary && <p className="piece-card-preview-summary">{module.summary}</p>}

          {module.videoReference?.videoId && (
            <VideoPlayer
              provider={module.videoReference.provider}
              videoId={module.videoReference.videoId}
              onEnded={() => {}}
              capSeconds={capSeconds}
              onPlaybackCapped={() => setShowCappedNotice(true)}
            />
          )}

          {showCappedNotice && (
            <div className="video-capped-notice">
              <p>訪客與試用期已結束的會員，每個 Module 僅能試看 10 秒。</p>
              <Link to="/account">登入或查看會員狀態</Link>
            </div>
          )}
        </div>
      )}
    </li>
  )
}

// revealAddedInPlace (Mobile Practice Builder redesign): when true, a
// Module already selected in THIS section stays visible in the grid
// (marked "已加入" via getModuleAvailability's existing disabled-reason
// mechanism, same as a cross-section conflict) instead of being
// filtered out entirely. Defaults to false so every existing caller --
// Desktop's DesktopActivePicker, and Mobile/Tablet's own Warm-Up-only
// usage before this redesign -- keeps its exact prior behavior/render
// output unless it explicitly opts in.
function ModulePickerCanvas({ category, modules, currentSectionIds, disabledIds, moduleSectionLabels, onAdd, revealAddedInPlace = false }) {
  const { profile } = useAuth()
  const membershipStatus = getMembershipStatus(profile)

  const candidates = modules
    .filter((module) => module.categories.includes(category))
    .filter((module) => revealAddedInPlace || !currentSectionIds.includes(module.id))

  if (candidates.length === 0) {
    return <p className="canvas-picker-empty">目前沒有屬於「{category}」的 Module。</p>
  }

  const groups = groupModulesBySubcategory(candidates)

  return (
    <div className="canvas-picker">
      <p className="canvas-picker-label">可加入的 Module</p>

      {groups.map((group) => (
        <div className="canvas-picker-group" key={group.subcategory ?? '__ungrouped'}>
          {group.subcategory && (
            <p className="canvas-picker-group-label">{group.subcategory}</p>
          )}

          <ul className="piece-list piece-list--picker">
            {group.modules.map((module) => {
              const { disabled, reason } = getModuleAvailability(module.id, { disabledIds, moduleSectionLabels })
              const alreadyInThisSection = revealAddedInPlace && currentSectionIds.includes(module.id)

              return (
                <PickerPieceCard
                  key={module.id}
                  module={module}
                  disabled={disabled}
                  reason={alreadyInThisSection ? '已加入' : reason}
                  onAdd={onAdd}
                  membershipStatus={membershipStatus}
                />
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default ModulePickerCanvas
