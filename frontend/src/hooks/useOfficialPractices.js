import { useCallback, useEffect, useState } from 'react'
import { listOfficialPracticesResult } from '../state/officialPracticeStore'

// Phase 6D: public read of Official Practices from Supabase -- the single
// runtime source of truth for Official Practices. Same .then()-based
// refresh shape as usePracticeHistory.js (no setState before the first
// await, so react-hooks/set-state-in-effect stays quiet).
//
// Filters to status === 'published' explicitly. RLS already hides
// draft/archived from a signed-out visitor, but an admin's own session
// sees every row -- and the public Hub / Home should still only ever
// show published ones (draft/archived are managed at /admin/practices).
// A plain `status === 'published'` check, not practiceLifecycle.isPublished
// (which was "not draft", and would wrongly let 'archived' through).
//
// `error` is a plain boolean -- the Practice Hub uses it only to choose
// between "no Official Practices yet" and "couldn't load" copy.
export function useOfficialPractices() {
  const [practices, setPractices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const refresh = useCallback(() => {
    return listOfficialPracticesResult().then(({ data, error: fetchError }) => {
      setPractices(data.filter((practice) => practice.status === 'published'))
      setError(Boolean(fetchError))
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { practices, loading, error, refresh }
}
