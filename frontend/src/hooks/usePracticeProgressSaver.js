import { useEffect, useRef } from 'react'
import { savePracticeSessionProgress } from '../state/practiceActivityStore'

// Practice Resume (Phase 5E). Auto-saves "which Module + where in its
// video" for the open practice session, with no Save button. Same
// lifecycle spirit as useModuleUsageTracking.js:
//   - an immediate save the moment there's a session and playback is
//     live (so even a short attempt becomes resumable straight away)
//   - a periodic heartbeat while playing (SAVE_INTERVAL_MS)
//   - an immediate save on visibilitychange -> hidden (the one event
//     that fires reliably on mobile background / tab close, per
//     useModuleUsageTracking's own comment -- beforeunload is not used)
//   - a final save on cleanup, which covers a Module change and leaving
//     the Player (the ✕ 離開練習 link is an in-app navigation, so
//     visibilitychange does NOT fire for it -- this cleanup is the only
//     save on that path)
//
// getPositionSeconds() returns null once the video engine has unmounted
// (its imperative handle is gone) -- which is exactly when the cleanup
// save runs. lastPositionRef, refreshed on a short mirror tick while
// playing, is the fallback so that final save records a real position
// instead of wiping progress back to 0.
//
// No-ops entirely without a sessionId. Progress may move backward -- this
// always reports the CURRENT position/index, never a high-water mark.
const SAVE_INTERVAL_MS = 20000
const POSITION_MIRROR_MS = 2000

export function usePracticeProgressSaver({ sessionId, moduleIndex, isPlaying, getPositionSeconds }) {
  const getPositionRef = useRef(getPositionSeconds)
  useEffect(() => {
    getPositionRef.current = getPositionSeconds
  }, [getPositionSeconds])

  const lastPositionRef = useRef(0)
  // Fresh per Module -- a save keyed to a new Module must never reuse the
  // previous Module's position if the engine is briefly unreadable.
  useEffect(() => {
    lastPositionRef.current = 0
  }, [moduleIndex])

  useEffect(() => {
    if (!sessionId) return undefined

    const readPosition = () => {
      const raw = getPositionRef.current?.()
      if (typeof raw === 'number' && raw >= 0) {
        lastPositionRef.current = raw
        return raw
      }
      return lastPositionRef.current
    }

    const save = () => savePracticeSessionProgress(sessionId, moduleIndex, readPosition())

    const handleVisibilityChange = () => {
      if (document.hidden) save()
    }

    if (isPlaying) save()

    const mirror = isPlaying ? setInterval(readPosition, POSITION_MIRROR_MS) : null
    const heartbeat = isPlaying ? setInterval(save, SAVE_INTERVAL_MS) : null
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (mirror) clearInterval(mirror)
      if (heartbeat) clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      save()
    }
  }, [sessionId, moduleIndex, isPlaying])
}
