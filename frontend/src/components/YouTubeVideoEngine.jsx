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

// Extracted from VideoPlayer.jsx unchanged (2026-08-21, Bunny-ready prep)
// so VideoPlayer.jsx can dispatch between this and HlsVideoEngine.jsx by
// provider. No behavior changed in this file — same YT.Player calls, same
// watchdog logic, same imperative handle shape as before the split.
const YouTubeVideoEngine = forwardRef(function YouTubeVideoEngine({ videoId, autoplay = false, onEnded, onAutoplayBlocked, onPlaybackResumed, onPlayStateChange }, ref) {
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
