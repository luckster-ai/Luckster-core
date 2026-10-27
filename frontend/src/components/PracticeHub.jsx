import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PracticeCard from './PracticeCard'
import modules from '../data/modules'
import { resolvePracticeModules } from '../utils/resolvePracticeModules'
import { getResumableSession } from '../state/practiceActivityStore'
import { evaluateResumableSession } from '../utils/practiceResume'
import { useAuth } from '../state/useAuth'

// Sprint 2A: /practice becomes a real Practice Hub with three sections
// -- 官方練習, 我的練習, 建立新練習 -- per the Practice Hub UX audit's
// recommended Option A (single hub, no new routes/tabs). "Official
// Guidance First": 官方練習 comes first and is the visually primary
// section; 我的練習 is clearly discoverable but secondary; 建立新練習
// stays a calm, small CTA rather than competing for attention.
//
// Phase 6D: 官方練習 is now async (Supabase). It renders whatever it has
// as soon as it has it; only a genuinely empty list falls through to the
// loading / error / empty copy below, in that priority order.
function PracticeHub({ officialPractices, customPractices, officialLoading, officialError }) {
  const hasCustomPractices = customPractices.length > 0
  const { user } = useAuth()

  // Website Refinement M8a: mark 我的練習 cards that still have a resumable
  // (unfinished, within the 12h window) session, using the same rule as
  // the Practice Detail page.
  const customKey = customPractices.map((practice) => practice.id).join('|')
  const [resumableIds, setResumableIds] = useState(() => new Set())
  useEffect(() => {
    if (!user || !customKey) return undefined
    let active = true
    Promise.all(
      customPractices.map(async (practice) => {
        const session = await getResumableSession(user.id, practice.id)
        const moduleIds = resolvePracticeModules(practice, modules).map((module) => module.id)
        return evaluateResumableSession(session, moduleIds).mode !== 'none' ? practice.id : null
      })
    ).then((ids) => {
      if (active) setResumableIds(new Set(ids.filter(Boolean)))
    })
    return () => {
      active = false
    }
    // customKey stands in for customPractices (a fresh array each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, customKey])
  const hasOfficialPractices = officialPractices.length > 0

  return (
    <section className="practice-hub">
      <h1>完整練習</h1>

      <p className="section-description">
        選擇一堂官方練習，或找到你先前建立的練習，開始今天的 Kundalini Yoga 練習。
      </p>

      <div className="practice-hub-section">
        <h2>官方練習</h2>

        {hasOfficialPractices ? (
          <div className="cards">
            {officialPractices.map((practice) => (
              <PracticeCard key={practice.id} practice={practice} />
            ))}
          </div>
        ) : officialLoading ? (
          <p>載入中…</p>
        ) : officialError ? (
          <p>暫時無法載入官方練習，請稍後再試。</p>
        ) : (
          <p>目前沒有官方練習。</p>
        )}
      </div>

      <div className="practice-hub-section">
        <h2>我的練習</h2>

        {hasCustomPractices ? (
          <div className="cards">
            {customPractices.map((practice) => (
              <PracticeCard
                key={practice.id}
                practice={practice}
                isCustom
                resumable={Boolean(user) && resumableIds.has(practice.id)}
              />
            ))}
          </div>
        ) : (
          <div className="practice-hub-empty">
            <p>目前還沒有自己建立的練習。建立一堂專屬於你的練習，之後會顯示在這裡。</p>

            <Link to="/practice/build" className="button secondary">
              建立新練習
            </Link>
          </div>
        )}
      </div>

      {hasCustomPractices && (
        <div className="practice-hub-create">
          <Link to="/practice/build" className="button secondary">
            ＋ 建立新練習
          </Link>
        </div>
      )}
    </section>
  )
}

export default PracticeHub
