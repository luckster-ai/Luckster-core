import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import modules from '../data/modules'
import foundations from '../data/foundations'
import { formatVideoDuration } from '../utils/formatDuration'
import { calculatePracticeDuration } from '../utils/calculatePracticeDuration'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import { getCustomPractice, isCustomPracticeSlug, useCustomPractices } from '../state/customPracticeStore'
import { getOfficialPracticeBySlug } from '../state/officialPracticeStore'
import { getResumableSession } from '../state/practiceActivityStore'
import { evaluateResumableSession } from '../utils/practiceResume'
import { useAuth } from '../state/useAuth'
import { useLearnerStatus } from '../hooks/useLearnerStatus'
import { collectPracticePrerequisites } from '../utils/prerequisiteEngine'
import { getMissingPrerequisites } from '../utils/learnerStatus'
import PracticeStep from '../components/PracticeStep'
import Phrases from '../components/Phrases'
import PracticePlayer from '../components/PracticePlayer'

// Difficulty shown in Chinese (same levels as PracticeCard's badge); an
// unknown value is shown as stored.
const DIFFICULTY_LABELS = { Beginner: '初級', Intermediate: '中級', Advanced: '高級' }

// Official Practice titles join their parts with "/" (e.g. 清晨薩達那/平靜/
// 自我權威冥想). A long title breaks only after a "/", never mid-part.
function splitTitle(title) {
  return title.match(/[^/]+\/?|\//g) || [title]
}

// A Custom Practice from this device's localStorage is the only
// synchronously-known Practice. Everything else is an Official Practice
// fetched from Supabase by slug (the routing key) -- the single runtime
// source of truth for Official Practices since Phase 6D.
function PracticePage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { learnerStatusMap } = useLearnerStatus()

  // Website Refinement M8b: Custom Practices load asynchronously for
  // signed-in members, so a custom slug waits for them instead of going
  // to the Official Practice lookup.
  const { ready: customReady, signedIn } = useCustomPractices()
  const localPractice = getCustomPractice(slug)
  const hasLocal = Boolean(localPractice)
  const isCustomSlug = isCustomPracticeSlug(slug)

  // Only the async Supabase lookup needs state. `resolving` is *derived*
  // (below) from "no remote result for the current slug yet", so nothing
  // here calls setState synchronously inside the effect. No offline cache
  // by design (Phase 6D): a failed fetch is its own 'error' outcome,
  // never a false 'not-found'.
  const [remote, setRemote] = useState({ slug: null, status: 'idle', practice: null })

  useEffect(() => {
    if (hasLocal || isCustomSlug) return

    let active = true

    getOfficialPracticeBySlug(slug).then(({ data, error }) => {
      if (!active) return

      setRemote({
        slug,
        status: error ? 'error' : data ? 'ready' : 'not-found',
        practice: data || null
      })
    })

    return () => {
      active = false
    }
  }, [slug, hasLocal, isCustomSlug])

  let status = 'ready'
  let practice = localPractice

  if (!hasLocal && isCustomSlug) {
    status = customReady ? 'not-found' : 'resolving'
    practice = null
  } else if (!hasLocal) {
    if (remote.slug === slug) {
      status = remote.status
      practice = remote.practice
    } else {
      status = 'resolving'
      practice = null
    }
  }

  const practiceId = practice?.id || null
  const moduleIdsKey = practice
    ? resolvePracticeModules(practice, modules).map((module) => module.id).join('|')
    : ''

  // Resume (Phase 5E; Website Refinement M8a): the player is on this page
  // from the start (no 開始練習 step), so any unfinished session within
  // the 12h window ('auto' or 'offer') resumes where it left off. The
  // last position is shown above, with 重新開始 to start from unit 1
  // instead -- a resume is never silent.
  const [resume, setResume] = useState({ practiceId: null, done: false, evaluation: { mode: 'none' } })
  // { slug } once 重新開始 was pressed for this Practice: the player is
  // re-mounted fresh (no resume). Tied to the slug, so another Practice
  // still resumes.
  const [restarted, setRestarted] = useState({ slug: null })
  // Keyed on the user's id, not the user object: a token refresh (about
  // hourly) gives a new object, and looking up again mid-practice would
  // find the session being played and re-mount the player on it.
  const userId = user?.id || null

  useEffect(() => {
    if (!practiceId) return

    let active = true
    const currentModuleIds = moduleIdsKey ? moduleIdsKey.split('|') : []
    const lookup = userId ? getResumableSession(userId, practiceId) : Promise.resolve(null)

    lookup.then((session) => {
      if (!active) return
      setResume({
        practiceId,
        done: true,
        evaluation: evaluateResumableSession(session, currentModuleIds)
      })
    })

    return () => {
      active = false
    }
  }, [practiceId, userId, moduleIdsKey])

  if (status === 'resolving') {
    return (
      <div className="practice-page">
        <p>載入中…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="practice-page">
        <h1>暫時無法載入</h1>
        <p>請稍後再試。</p>
      </div>
    )
  }

  if (!practice) {
    return (
      <div className="practice-page">
        <h1>找不到課程</h1>
        <p>此練習不存在。</p>
      </div>
    )
  }

  const orderedModules = resolvePracticeModules(practice, modules)
  const totalDuration = calculatePracticeDuration(practice, modules)

  const doResume = resume.evaluation.mode !== 'none' && restarted.slug !== slug

  const missingPrerequisites = getMissingPrerequisites(
    collectPracticePrerequisites(practice, { foundations, modules }),
    learnerStatusMap
  )

  return (
    <div className="practice-page">
      {/* Phones only -- on desktop the header's 完整練習 link is visible. */}
      <Link to="/practice" className="practice-player-exit back-mobile-only">
        ← 返回完整練習
      </Link>

      <section className="practice-header">
        <h1 className="practice-page-title">
          <Phrases text={splitTitle(practice.chineseTitle)} />
        </h1>

        {practice.difficulty && (
          <p className="card-duration">難度：{DIFFICULTY_LABELS[practice.difficulty] || practice.difficulty}</p>
        )}

        <p className="card-duration">影片時長：{formatVideoDuration(totalDuration)}</p>

        {practice.description && <p className="practice-page-description">{practice.description}</p>}

        {/* Signed in: only the ones not completed yet. Signed out (no
            learning data): every prerequisite. */}
        {missingPrerequisites.length > 0 && (
          <p className="lesson-prerequisites practice-page-prerequisites">
            建議先完成：
            {missingPrerequisites.map((item, index) => (
              <span key={item.id}>
                {index > 0 && '、'}
                {item.type === 'lesson' ? (
                  <Link
                    to={`/foundations/${item.foundationSlug}/${item.slug}`}
                    state={{ fromPractice: slug }}
                  >
                    {item.chineseTitle}
                  </Link>
                ) : (
                  <Link to={`/modules/${item.slug}`}>{item.chineseTitle}</Link>
                )}
              </span>
            ))}
          </p>
        )}

        {practice.isCustom && (
          <p className="practice-custom-note">
            {signedIn
              ? '這是你建立的練習，已儲存在你的帳號，可以在其他裝置使用。'
              : '這是你建立的練習，目前儲存在此裝置的瀏覽器中；登入後會同步到你的帳號。'}
          </p>
        )}

        {resume.done && resume.practiceId === practiceId && doResume && (
          <div className="practice-page-actions">
            <p className="practice-resume-note">
              從上次的位置繼續：第 {resume.evaluation.moduleIndex + 1} 個練習單元{' '}
              {formatVideoDuration(Math.floor(resume.evaluation.positionSeconds))}
            </p>

            <button type="button" className="button secondary" onClick={() => setRestarted({ slug })}>
              重新開始
            </button>
          </div>
        )}

        {practice.isCustom && (
          <div className="practice-page-actions">
            <Link to={`/practice/build?edit=${slug}`} className="button secondary">
              編輯練習
            </Link>
          </div>
        )}
      </section>

      <div className="practice-page-player">
        {!(resume.done && resume.practiceId === practiceId) ? (
          <p>載入中…</p>
        ) : (
          <PracticePlayer
            key={`${slug}:${doResume ? 'resume' : 'fresh'}`}
            practice={practice}
            modules={orderedModules}
            {...(doResume
              ? {
                  initialModuleIndex: resume.evaluation.moduleIndex,
                  initialPositionSeconds: resume.evaluation.positionSeconds,
                  resumeSessionId: resume.evaluation.sessionId
                }
              : {})}
          />
        )}
      </div>

      <section className="practice-sequence-section">
        <ol className="practice-sequence">
          {orderedModules.map((module, index) => (
            <PracticeStep
              key={module.slug}
              module={module}
              order={index + 1}
            />
          ))}
        </ol>
      </section>
    </div>
  )
}

export default PracticePage
