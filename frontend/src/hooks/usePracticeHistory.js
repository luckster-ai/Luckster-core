import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../state/useAuth'
import { getOwnPracticeSessions } from '../state/practiceActivityStore'

// Practice History (Phase 5D). Same .then()-based refresh shape as
// useLearnerStatus.js -- calling an async function directly from
// useEffect's body runs everything before its first await synchronously
// as part of the effect (including the no-request `!user` branch, which
// never reaches an await at all), which is what
// react-hooks/set-state-in-effect flags; Promise.resolve([]).then(...)
// still defers to a microtask either way.
export function usePracticeHistory() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(Boolean(user))

  const refresh = useCallback(() => {
    const request = user ? getOwnPracticeSessions(user.id) : Promise.resolve([])

    return request.then((data) => {
      setSessions(data)
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { sessions, loading }
}
