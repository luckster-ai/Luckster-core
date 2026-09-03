import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../state/useAuth'
import { getOwnPracticeSessions } from '../state/practiceActivityStore'
import { listOfficialPractices } from '../state/officialPracticeStore'

// Practice History (Phase 5D). Same .then()-based refresh shape as
// useLearnerStatus.js -- calling an async function directly from
// useEffect's body runs everything before its first await synchronously
// as part of the effect (including the no-request `!user` branch, which
// never reaches an await at all), which is what
// react-hooks/set-state-in-effect flags; Promise.resolve([]).then(...)
// still defers to a microtask either way.
//
// Phase 6D: also fetches the Official Practice list once and hands
// PracticeHistory an id -> practice Map, so History rows for a Supabase
// Official Practice can show a real title and link. listOfficialPractices()
// returns [] on any failure, so those rows just fall back to Module
// titles -- same graceful path as an unresolvable Custom Practice.
export function usePracticeHistory() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [officialById, setOfficialById] = useState(() => new Map())
  const [loading, setLoading] = useState(Boolean(user))

  const refresh = useCallback(() => {
    const sessionsRequest = user ? getOwnPracticeSessions(user.id) : Promise.resolve([])
    const officialRequest = user ? listOfficialPractices() : Promise.resolve([])

    return Promise.all([sessionsRequest, officialRequest]).then(([sessionData, officialData]) => {
      setSessions(sessionData)
      setOfficialById(new Map(officialData.map((practice) => [practice.id, practice])))
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { sessions, officialById, loading }
}
