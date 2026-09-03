import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import modules from '../data/modules'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import { getCustomPractice } from '../state/customPracticeStore'
import { getOfficialPracticeBySlug } from '../state/officialPracticeStore'
import PracticePlayer from '../components/PracticePlayer'

// Same resolution order as PracticePage: a device-local Custom Practice
// first, otherwise an Official Practice fetched from Supabase by slug.
// The playback chain below (PracticePlayer) is unchanged -- it only ever
// consumes the resolved Module objects and practice.id / practice.slug,
// which are identical whatever the source.
function PracticePlayerPage() {
  const { slug } = useParams()

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

  return (
    <PracticePlayer practice={practice} modules={orderedModules} />
  )
}

export default PracticePlayerPage
