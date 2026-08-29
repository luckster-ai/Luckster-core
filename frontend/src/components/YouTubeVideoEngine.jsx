import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import loadYouTubeIframeAPI from '../utils/loadYouTubeIframeAPI'

// Backstop only, not the primary signal — PLAYING/PAUSED (real player
// state) always wins if either arrives first. Observed empirically: a
// blocked loadVideoById() autoplay doesn't always settle into PAUSED, it
// can also sit in BUFFERING indefinitely. Without this, that case would
// never surface the resume prompt at all. 6s comfortably exceeds normal
// buffering on a reasonable connection without making the prompt feel
// trigger-happy.
const AUTOPLAY_WATCHDOG_MS = 6000

// Trial / Visitor Gating (Phase 4E). The YT IFrame API has no native
// per-frame position event (unlike <video>'s timeupdate in
// HlsVideoEngine.jsx), so position is polled at this interval while
// PLAYING -- tight enough that overshoot past capSeconds is never
// visually noticeable, far coarser than anything that would matter for
// request volume (it's a local getCurrentTime() call, not network).
const CAP_POLL_MS = 250

// Extracted from VideoPlayer.jsx unchanged (2026-08-21, Bunny-ready prep)
// so VideoPlayer.jsx can dispatch between this and HlsVideoEngine.jsx by
// provider. No behavior changed in this file — same YT.Player calls, same
// watchdog logic, same imperative handle shape as before the split.
const YouTubeVideoEngine = forwardRef(function YouTubeVideoEngine({ videoId, autoplay = false, onEnded, onAutoplayBlocked, onPlaybackResumed, onPlayStateChange, capSeconds, onPlaybackCapped }, ref) {
  const wrapperRef = useRef(null)
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  // Read at the moment the (possibly-delayed, see loadYouTubeIframeAPI()
  // below) YT.Player gets constructed, not closed over at mount time.
  const autoplayRef = useRef(autoplay)
  autoplayRef.current = autoplay
  const onEndedRef = useRef(onEnded)
  const onAutoplayBlockedRef = useRef(onAutoplayBlocked)
  const onPlaybackResumedRef = useRef(onPlaybackResumed)
  // Phase 4C: reports actual play/stop state (true only while genuinely
  // PLAYING -- PAUSED/ENDED/BUFFERING/CUED all report false), independent
  // of the autoplay-watchdog machinery below. Optional -- no caller
  // passes this yet, so it's inert until a future phase wires a consumer.
  const onPlayStateChangeRef = useRef(onPlayStateChange)
  // Trial / Visitor Gating (Phase 4E) -- see the equivalent refs/comment
  // in HlsVideoEngine.jsx. In practice this engine only ever receives an
  // actual (non-undefined) capSeconds if a future product decision caps
  // YouTube content too -- today every caller resolves capSeconds from
  // provider, and YouTube is never gated (Phase 4A) -- but the engine
  // implements it for real, the same way onPlayStateChange existed here
  // since Phase 4C before any caller passed it.
  const capSecondsRef = useRef(capSeconds)
  const onPlaybackCappedRef = useRef(onPlaybackCapped)
  const capPollTimerRef = useRef(null)
  // Set right before loadVideoById() on a Module transition (never on the
  // very first cued video, where "not yet playing" is expected until the
  // user clicks 播放). Cleared as soon as we know the outcome: a real
  // PLAYING/PAUSED signal from the player (preferred), or — only if
  // neither arrives — the AUTOPLAY_WATCHDOG_MS backstop below.
  const watchingAutoplayRef = useRef(false)
  const watchdogTimerRef = useRef(null)

  const clearAutoplayWatchdog = () => {
    if (watchdogTimerRef.current !== null) {
      clearTimeout(watchdogTimerRef.current)
      watchdogTimerRef.current = null
    }
  }

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    onAutoplayBlockedRef.current = onAutoplayBlocked
  }, [onAutoplayBlocked])

  useEffect(() => {
    onPlaybackResumedRef.current = onPlaybackResumed
  }, [onPlaybackResumed])

  useEffect(() => {
    onPlayStateChangeRef.current = onPlayStateChange
  }, [onPlayStateChange])

  useEffect(() => {
    capSecondsRef.current = capSeconds
  }, [capSeconds])

  useEffect(() => {
    onPlaybackCappedRef.current = onPlaybackCapped
  }, [onPlaybackCapped])

  const clearCapPoll = () => {
    if (capPollTimerRef.current !== null) {
      clearInterval(capPollTimerRef.current)
      capPollTimerRef.current = null
    }
  }

  // Same reasoning as HlsVideoEngine.jsx's enforceCap(): position-based,
  // re-checked continuously while PLAYING (started/stopped below) so a
  // capSeconds change landing mid-playback (Trial expiring) is caught
  // within one poll tick, and seekTo(...) clamping (not just pauseVideo())
  // closes the "scrub within an already-buffered/cached range" hole the
  // same way currentTime-clamping does for the HLS engine.
  function enforceCap() {
    const cap = capSecondsRef.current
    const player = playerRef.current
    if (cap == null || !player) return

    const current = player.getCurrentTime()
    if (current < cap) return

    if (current > cap) player.seekTo(cap, true)
    player.pauseVideo()
    onPlaybackCappedRef.current?.()
  }

  useEffect(() => {
    if (playerRef.current) {
      watchingAutoplayRef.current = true
      clearAutoplayWatchdog()
      watchdogTimerRef.current = setTimeout(() => {
        watchdogTimerRef.current = null
        if (!watchingAutoplayRef.current) return
        watchingAutoplayRef.current = false
        onAutoplayBlockedRef.current?.()
      }, AUTOPLAY_WATCHDOG_MS)
      playerRef.current.loadVideoById(videoId)
      return
    }

    let isMounted = true

    loadYouTubeIframeAPI().then((YT) => {
      if (!isMounted || !containerRef.current || playerRef.current) return

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        // Only set when autoplayRef is true (a freshly-mounted Engine
        // after a cross-provider Module transition, see VideoModule.jsx's
        // hasStartedRef) — the Practice's genuine first video must stay
        // cued until the user's own 播放 click, same as before this prop
        // existed.
        playerVars: autoplayRef.current ? { autoplay: 1 } : undefined,
        events: {
          onStateChange(event) {
            // Phase 4C: unconditional, unlike the watchdog-gated logic
            // below -- PLAYING is the only state that counts as "playing"
            // (PAUSED/ENDED/BUFFERING/CUED all correctly fall through to
            // false as one single check, no per-state branching needed).
            onPlayStateChangeRef.current?.(event.data === YT.PlayerState.PLAYING)

            // Trial / Visitor Gating (Phase 4E): poll only while actually
            // PLAYING (any other state has nothing new to enforce, and
            // getCurrentTime() during BUFFERING/CUED isn't meaningful).
            // enforceCap() runs once immediately on entering PLAYING too,
            // not just on the first poll tick, so a replay that starts
            // already at/past capSeconds (pausing right at the cap, then
            // pressing play again) is caught without a visible flash of
            // forward progress.
            clearCapPoll()
            if (event.data === YT.PlayerState.PLAYING) {
              enforceCap()
              capPollTimerRef.current = setInterval(enforceCap, CAP_POLL_MS)
            }

            if (event.data === YT.PlayerState.ENDED) {
              watchingAutoplayRef.current = false
              clearAutoplayWatchdog()
              onEndedRef.current()
              return
            }

            if (!watchingAutoplayRef.current) return

            if (event.data === YT.PlayerState.PLAYING) {
              watchingAutoplayRef.current = false
              clearAutoplayWatchdog()
              onPlaybackResumedRef.current?.()
            } else if (event.data === YT.PlayerState.PAUSED) {
              // loadVideoById() loaded the next video but the browser's
              // autoplay policy did not let it start — this only fires on
              // a Module transition, never on first load.
              watchingAutoplayRef.current = false
              clearAutoplayWatchdog()
              onAutoplayBlockedRef.current?.()
            }
          }
        }
      })
    })

    return () => {
      isMounted = false
    }
  }, [videoId])

  useEffect(() => {
    return () => {
      clearAutoplayWatchdog()
      clearCapPoll()
      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [])

  useImperativeHandle(ref, () => ({
    play() {
      playerRef.current?.playVideo()
    },
    pause() {
      playerRef.current?.pauseVideo()
    },
    requestFullscreen() {
      // Only ever called from a direct click handler (never automatically
      // on load or on a Module transition) so it stays inside the user
      // gesture the Fullscreen API requires. Fullscreens the stable
      // wrapper div rather than the YouTube <iframe> itself — the iframe
      // gets replaced by React/YT internals across renders, but this
      // wrapper never does, so fullscreen state naturally carries over
      // between Modules (loadVideoById() only swaps content inside it).
      const element = wrapperRef.current
      if (!element) return

      const request =
        element.requestFullscreen ||
        element.webkitRequestFullscreen ||
        element.msRequestFullscreen

      if (typeof request !== 'function') return

      try {
        const result = request.call(element)
        if (result && typeof result.catch === 'function') {
          result.catch(() => {
            // Browser declined fullscreen — playback continues normally.
          })
        }
      } catch {
        // Fullscreen unsupported in this browser — no error surfaced.
      }
    }
  }))

  return (
    <div className="video-player" ref={wrapperRef}>
      <div ref={containerRef} className="video-player-frame" />
    </div>
  )
})

export default YouTubeVideoEngine
