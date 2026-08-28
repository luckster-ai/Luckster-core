import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../state/useAuth'
import { getLearnerStatusMap, markLearningCompleted } from '../state/learningProgressStore'

// Learning Data (Phase 3). Logged-out callers get isLoggedIn: false and
// an always-empty learnerStatusMap -- pages use that flag to skip
// rendering any learner-specific status/prerequisite UI entirely for
// visitors, rather than showing a map that would otherwise make every
// prerequisite look "missing" (see the Phase 3 analysis note on this).
export function useLearnerStatus() {
  const { user } = useAuth()
  const [learnerStatusMap, setLearnerStatusMap] = useState({})
  const [loading, setLoading] = useState(Boolean(user))

  // .then()-based (not async/await) so the setState calls below always
  // run in a microtask callback, never synchronously as part of this
  // function's own call -- calling an async function directly from a
  // useEffect body runs everything before its first `await` (including
  // the no-op `!user` branch, which never reaches an `await` at all)
  // synchronously within the effect, which is exactly what react-hooks/
  // set-state-in-effect flags. Promise.resolve({}).then(...) still
  // defers, even though there's no real async work to wait for.
  const refresh = useCallback(() => {
    const request = user ? getLearnerStatusMap(user.id) : Promise.resolve({})

    return request.then((map) => {
      setLearnerStatusMap(map)
      setLoading(false)
    })
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function markCompleted(assetType, assetId) {
    if (!user) return

    const { error } = await markLearningCompleted(user.id, assetType, assetId)

    if (!error) await refresh()
  }

  return {
    isLoggedIn: Boolean(user),
    loading,
    learnerStatusMap,
    markCompleted
  }
}
