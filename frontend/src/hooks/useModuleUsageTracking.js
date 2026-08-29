import { useEffect, useRef } from 'react'
import { useAuth } from '../state/useAuth'
import { recordModuleUsage } from '../state/moduleUsageStore'
import { getMembershipStatus } from '../utils/membershipStatus'
import { shouldTrackModuleUsage } from '../utils/playbackEntitlement'

// Trial / Module Usage Tracking client wiring (Phase 4D, gated by
// membershipStatus since Phase 4E). Turns the player's onPlayStateChange
// (Phase 4C) + document visibility into heartbeat calls against
// record_module_usage() (Phase 4B). Deliberately does NOT try to track
// "foreground" itself -- the server already bounds every heartbeat to
// LEAST(what we claim, real wall-clock gap since the last heartbeat), so
// all this hook has to get right is: only count seconds while genuinely
// playing AND visible, and never let one call's claimed seconds cross a
// Module boundary.
//
// 20s heartbeat / 60s per-flush cap (both below): chosen for this app,
// not hardcoded from a general rule --
//   - 20s keeps a crash/kill's worst-case loss small (favors the member)
//     while staying nowhere near a request-volume concern for a single
//     UPDATE+INSERT (a 3-hour session is ~540 calls total).
//   - 60s (3x the heartbeat) is a ceiling that a normal foreground+
//     playing session never approaches -- background tabs never
//     accumulate at all (see mark() below), so the only way to hit it is
//     a genuinely stale "still playing" signal surviving a real gap
//     (OS sleep, a frozen/suspended tab). The server's own
//     LEAST(client, server_gap) can't catch that case, because in it
//     the server-side gap is *also* large and real -- this client-side
//     cap is the one thing standing between that edge case and a member
//     losing hours of Trial time for nothing they actually did.
const HEARTBEAT_INTERVAL_MS = 20000
const MAX_FLUSH_SECONDS = 60

export function useModuleUsageTracking({ moduleId, provider, isPlaying }) {
  const { profile, refreshProfile } = useAuth()
  const membershipStatus = getMembershipStatus(profile)
  const eligible = shouldTrackModuleUsage({ membershipStatus, provider }) && Boolean(moduleId)

  // Ref, not a direct closure capture -- refreshProfile is a fresh
  // function identity every AuthProvider render (not memoized), but this
  // effect only re-runs when [eligible, isPlaying, moduleId] change, so
  // without this it could call a stale closure. Same ref-sync pattern as
  // every other callback prop in this codebase (see VideoPlayer.jsx's
  // engines).
  const refreshProfileRef = useRef(refreshProfile)
  useEffect(() => {
    refreshProfileRef.current = refreshProfile
  }, [refreshProfile])

  useEffect(() => {
    if (!eligible || !isPlaying) return undefined

    // Closure state, not refs -- deliberately scoped to this one
    // eligible+playing+moduleId "session": a fresh session starts (fresh
    // accumulated/lastMark) every time any of those three actually
    // change, and the cleanup below always flushes the PREVIOUS
    // session's own moduleId, never the new one -- that's what makes a
    // Module switch mid-playback impossible to mis-attribute.
    let accumulated = 0
    let lastMark = document.hidden ? null : performance.now()

    // Reads real elapsed time since the last mark/flush, but only counts
    // it if lastMark isn't null -- null means "currently hidden," so the
    // whole gap since it went null is correctly excluded. Always resets
    // lastMark to now-or-null so the next call measures fresh.
    function mark() {
      const now = performance.now()
      if (lastMark !== null) accumulated += (now - lastMark) / 1000
      lastMark = document.hidden ? null : now
    }

    function flush() {
      mark()

      // Capping (not just flooring) accumulated itself, before deriving
      // seconds/remainder from it, is what makes MAX_FLUSH_SECONDS an
      // actual discard of anything above the cap rather than a delay --
      // an anomalous 200s gap becomes a 60s credit and the other 140s is
      // gone, not silently carried into the next flush.
      accumulated = Math.min(accumulated, MAX_FLUSH_SECONDS)

      const seconds = Math.floor(accumulated)
      if (seconds >= 1) {
        // Phase 4E: re-checking membership status only after a heartbeat
        // that actually credited something (not on every tick) is what
        // lets gating notice "just crossed 30 hours" within one
        // heartbeat interval, without polling separately from the
        // heartbeat that's already the thing moving the number.
        recordModuleUsage(moduleId, seconds).then(() => refreshProfileRef.current())
      }
      accumulated -= seconds
    }

    function handleVisibilityChange() {
      mark()
      // Flush immediately on leaving the foreground (tab switch, app
      // switch, closing the tab) rather than waiting for the next
      // heartbeat -- this is the primary defense against losing a whole
      // in-progress interval's usage to an abrupt close, since
      // visibilitychange fires far more reliably than beforeunload/
      // unload (notably on mobile).
      if (document.hidden) flush()
    }

    const heartbeat = setInterval(flush, HEARTBEAT_INTERVAL_MS)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(heartbeat)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flush()
    }
  }, [eligible, isPlaying, moduleId])
}
