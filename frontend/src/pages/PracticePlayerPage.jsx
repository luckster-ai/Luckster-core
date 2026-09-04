import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import modules from '../data/modules'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import { getCustomPractice } from '../state/customPracticeStore'
import { getOfficialPracticeBySlug } from '../state/officialPracticeStore'
import { getResumableSession } from '../state/practiceActivityStore'
import { evaluateResumableSession } from '../utils/practiceResume'
import { useAuth } from '../state/useAuth'
import PracticePlayer from '../components/PracticePlayer'

// Same resolution order as PracticePage: a device-local Custom Practice
// first, otherwise an Official Practice fetched from Supabase by slug.
//
// Phase 5E (Resume): once the Practice is known, look up the viewer's
// most recent unfinished session for it and decide -- 'auto' (<=1h:
// resume silently), 'offer' (1-12h: only resume if arrived via the
// Detail "繼續練習" link, ?resume=1) or 'none'. ?resume=0 (the Detail
// "重新開始" link) always forces a fresh attempt.
function PracticePlayerPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()

  const localPractice = getCustomPractice(slug)
  const hasLocal = Boolean(localPractice)

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
  // Stable-by-value key of the current resolved Module id list -- lets the
  // resume effect below depend on "did the Practice's Modules change"
  // without re-running on every render (Custom Practice objects are a
  // fresh identity each render).
  const moduleIdsKey = practice
    ? resolvePracticeModules(practice, modules).map((module) => module.id).join('|')
    : ''

  const [resume, setResume] = useState({ practiceId: null, done: false, result: null })

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
        result: evaluateResumableSession(session, currentModuleIds)
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

  if (!resume.done || resume.practiceId !== practiceId) {
    return (
      <div className="practice-page">
        <p>載入中…</p>
      </div>
    )
  }

  const orderedModules = resolvePracticeModules(practice, modules)

  const resumeParam = searchParams.get('resume')
  const evaluation = resume.result || { mode: 'none' }

  let doResume
  if (resumeParam === '0') {
    doResume = false
  } else if (resumeParam === '1') {
    doResume = evaluation.mode === 'auto' || evaluation.mode === 'offer'
  } else {
    doResume = evaluation.mode === 'auto'
  }

  const resumeProps = doResume
    ? {
        initialModuleIndex: evaluation.moduleIndex,
        initialPositionSeconds: evaluation.positionSeconds,
        resumeSessionId: evaluation.sessionId
      }
    : {}

  return (
    <PracticePlayer practice={practice} modules={orderedModules} {...resumeProps} />
  )
}

export default PracticePlayerPage
