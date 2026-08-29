import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import modules from '../data/modules'
import foundations from '../data/foundations'
import { formatVideoDuration } from '../utils/formatDuration'
import VideoPlayer from '../components/VideoPlayer'
import { useLearnerStatus } from '../hooks/useLearnerStatus'
import { useModuleUsageTracking } from '../hooks/useModuleUsageTracking'
import { collectModulePrerequisites } from '../utils/prerequisiteEngine'
import { getMissingPrerequisites, LEARNER_STATUS } from '../utils/learnerStatus'

const markdownModules = import.meta.glob(
  '../content/modules/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

function ModulePage() {
  const { slug } = useParams()

  const module = modules.find(
    (item) => item.slug === slug
  )

  const { isLoggedIn, learnerStatusMap, markCompleted } = useLearnerStatus()

  // Phase 4D: this page's VideoPlayer instance can survive a route param
  // change (React Router reuses the same ModulePage instance across
  // /modules/:slug navigations), so a stale isPlaying=true from whatever
  // Module was open before must not leak into the next one. Render-time
  // reset (same pattern as VideoModule.jsx's trackedSlug), not a
  // useEffect -- keeps the reset in the same render/commit as the
  // module.id change instead of one commit behind it.
  const [isPlaying, setIsPlaying] = useState(false)
  const [trackedModuleId, setTrackedModuleId] = useState(module?.id)
  if (trackedModuleId !== module?.id) {
    setTrackedModuleId(module?.id)
    setIsPlaying(false)
  }

  useModuleUsageTracking({
    moduleId: module?.id,
    provider: module?.videoReference?.provider,
    isPlaying
  })

  if (!module) {
    return (
      <div className="module-page">
        <h1>找不到課程</h1>
        <p>此 Module 不存在。</p>
      </div>
    )
  }

  const markdownPath = `../content/modules/${slug}.md`
  const markdown = markdownModules[markdownPath] || ''

  const moduleStatus = learnerStatusMap[module.id]
  const isModuleComplete =
    moduleStatus === LEARNER_STATUS.COMPLETED || moduleStatus === LEARNER_STATUS.ALREADY_LEARNED

  const missingPrerequisites = getMissingPrerequisites(
    collectModulePrerequisites(module, { foundations, modules }),
    learnerStatusMap
  )

  return (
    <div className="module-page">
      <h1>{module.title}</h1>

      <p>
        <strong>難度：</strong> {module.difficulty}
      </p>

      <p>
        <strong>影片時長：</strong> {formatVideoDuration(module.duration)}
      </p>

      <p>{module.summary}</p>

      {isLoggedIn && missingPrerequisites.length > 0 && (
        <div className="prerequisite-notice">
          <p>建議先完成以下先備知識：</p>

          <ul>
            {missingPrerequisites.map((item) => (
              <li key={item.id}>
                {item.type === 'lesson' ? (
                  <Link to={`/foundations/${item.foundationSlug}/${item.slug}`}>{item.chineseTitle}</Link>
                ) : (
                  <Link to={`/modules/${item.slug}`}>{item.chineseTitle}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {isLoggedIn && (
        <p className="learning-status">
          {isModuleComplete ? (
            '✓ 已完成'
          ) : (
            <button
              type="button"
              className="button secondary"
              onClick={() => markCompleted('module', module.id)}
            >
              標記完成
            </button>
          )}
        </p>
      )}

      {module.videoReference?.provider === 'youtube' && module.videoReference?.videoId && (
        <p>
          <a
            href={`https://www.youtube.com/watch?v=${module.videoReference.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            前往 YouTube 觀看
          </a>
        </p>
      )}

      {/* Bunny (2026-08-25): standalone playback via the same
          provider-agnostic VideoPlayer LessonDetail.jsx already uses for
          Foundation lessons -- no custom Fullscreen button (matches the
          native-controls-only decision made for VideoModule.jsx), and
          onEnded is a required prop on the imperative handle (both
          Engines call it unconditionally when playback ends), so it must
          be passed even though this standalone view has nothing to
          advance to. */}
      {module.videoReference?.provider === 'bunny' && module.videoReference?.videoId && (
        <VideoPlayer
          provider="bunny"
          videoId={module.videoReference.videoId}
          onEnded={() => {}}
          onPlayStateChange={setIsPlaying}
        />
      )}

      <hr />

      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}

export default ModulePage
