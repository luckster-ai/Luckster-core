import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import modules from '../data/modules'
import foundations from '../data/foundations'
import formatDuration from '../utils/formatDuration'
import { calculatePracticeDuration } from '../utils/calculatePracticeDuration'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import { getCustomPractice } from '../state/customPracticeStore'
import { getOfficialPracticeBySlug } from '../state/officialPracticeStore'
import { getResumableSession } from '../state/practiceActivityStore'
import { evaluateResumableSession } from '../utils/practiceResume'
import { useAuth } from '../state/useAuth'
import { useLearnerStatus } from '../hooks/useLearnerStatus'
import { collectPracticePrerequisites } from '../utils/prerequisiteEngine'
import { getMissingPrerequisites } from '../utils/learnerStatus'
import PracticeStep from '../components/PracticeStep'

// A Custom Practice from this device's localStorage is the only
// synchronously-known Practice. Everything else is an Official Practice
// fetched from Supabase by slug (the routing key) -- the single runtime
// source of truth for Official Practices since Phase 6D.
function PracticePage() {
  const { slug } = useParams()
  const { user } = useAuth()
  const { isLoggedIn, learnerStatusMap } = useLearnerStatus()

  const localPractice = getCustomPractice(slug)
  const hasLocal = Boolean(localPractice)

  // Only the async Supabase lookup needs state. `resolving` is *derived*
  // (below) from "no remote result for the current slug yet", so nothing
  // here calls setState synchronously inside the effect. No offline cache
  // by design (Phase 6D): a failed fetch is its own 'error' outcome,
  // never a false 'not-found'.
  const [remote, setRemote] = useState({ slug: null, status: 'idle', practice: null })

  useEffect(() => {
    if (hasLocal) return

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
  }, [slug, hasLocal])

  let status = 'ready'
  let practice = localPractice

  if (!hasLocal) {
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

  // Resume (Phase 5E): a 1-12h unfinished session for this Practice makes
  // the single 開始練習 button become 繼續練習 / 重新開始 (see the CTA
  // block below). <=1h resumes silently in the Player, so it stays a
  // single 開始練習 here.
  const [resume, setResume] = useState({ practiceId: null, done: false, mode: 'none' })

  useEffect(() => {
    if (!practiceId) return

    let active = true
    const currentModuleIds = moduleIdsKey ? moduleIdsKey.split('|') : []
    const lookup = user ? getResumableSession(user.id, practiceId) : Promise.resolve(null)

    lookup.then((session) => {
      if (!active) return
      setResume({
        practiceId,
        done: true,
        mode: evaluateResumableSession(session, currentModuleIds).mode
      })
    })

    return () => {
      active = false
    }
  }, [practiceId, user, moduleIdsKey])

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
        <p>此 Practice 不存在。</p>
      </div>
    )
  }

  const orderedModules = resolvePracticeModules(practice, modules)
  const totalDuration = calculatePracticeDuration(practice, modules)

  const missingPrerequisites = getMissingPrerequisites(
    collectPracticePrerequisites(practice, { foundations, modules }),
    learnerStatusMap
  )

  return (
    <div className="practice-page">
      <section className="practice-header">
        <h1>{practice.chineseTitle}</h1>

        <p className="module-playback-subtitle">{practice.title}</p>

        <p>
          <strong>難度：</strong> {practice.difficulty}
        </p>

        <p>
          <strong>時長：</strong> {formatDuration(totalDuration)}
        </p>

        <p>{practice.description}</p>

        {isLoggedIn && missingPrerequisites.length > 0 && (
          <div className="prerequisite-notice">
            <p>建議先完成以下先備知識，再開始這堂 Practice：</p>

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

        {practice.isCustom && (
          <p className="practice-custom-note">
            這是你建立的 Practice，儲存在此裝置的瀏覽器中（尚未提供跨裝置同步）。
          </p>
        )}

        {!(resume.done && resume.practiceId === practiceId) ? (
          <p>載入中…</p>
        ) : resume.mode === 'offer' ? (
          <>
            <Link to={`/practices/${slug}/play?resume=1`} className="button">
              繼續練習
            </Link>

            <Link to={`/practices/${slug}/play?resume=0`} className="button secondary">
              重新開始
            </Link>
          </>
        ) : (
          <Link to={`/practices/${slug}/play`} className="button">
            開始練習
          </Link>
        )}

        {practice.isCustom && (
          <Link to={`/practice/build?edit=${slug}`} className="button secondary">
            編輯 Practice
          </Link>
        )}
      </section>

      <section className="practice-sequence-section">
        <h2>今日練習 Today's Practice</h2>

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
