import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// Same backstop role as YouTubeVideoEngine's AUTOPLAY_WATCHDOG_MS — kept
// as an identical constant/value rather than a shared import, since the
// two engines' state machines are independent and this is the only thing
// they'd share.
const AUTOPLAY_WATCHDOG_MS = 6000

// canPlayType('application/vnd.apple.mpegurl') is not a reliable signal on
// its own: real-device testing (2026-08-21, Desktop Chrome 151) found it
// returns "maybe" there too, even though Chromium has never shipped native
// HLS demuxing — the browser stalls forever (loadstart -> stalled, never
// loadedmetadata) if you trust it and set <video src> directly. Real
// native HLS playback is a WebKit/Safari-specific capability, so it also
// needs a UA check gating the canPlayType() result, not canPlayType()
// alone. Excludes Chrome/Firefox/Edge-on-iOS (CriOS/FxiOS/EdgiOS), which
// are untested for this engine and out of scope here (see
// docs/progress for the Chrome-only verification this fix is based on).
const isRealSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent)

// "Bunny-ready" HLS engine (2026-08-21 prep) — plays an HLS (.m3u8) src
// via a native <video> element. Same imperative handle / callback shape
// as YouTubeVideoEngine.jsx so VideoPlayer.jsx can dispatch between the
// two without either caller or consumer knowing which one is active.
//
// videoId here is treated as a fully-resolved HLS playlist URL, not a
// YouTube-style short ID. NEEDS BUNNY REAL ENVIRONMENT: turning a real
// Bunny videoReference (library id + video GUID) into that URL is not
// implemented here — there is no real Bunny library/pull-zone to build
// against yet. That mapping is a small, separate piece of work for the
// next (paid) phase; this engine only needs *a* HLS URL, wherever it
// comes from.
//
// Engine selection: real Safari (see isRealSafari above) has native HLS
// support in <video> and is preferred there (matches the already-verified
// iPhone Safari POC behavior exactly — no library involved). Everywhere
// else (Chrome, Android Chrome, etc.) falls back to hls.js, dynamically
// imported so its ~200KB isn't shipped to users who only ever play
// YouTube-provider content (same lazy-loading spirit as
// loadYouTubeIframeAPI.js).
const HlsVideoEngine = forwardRef(function HlsVideoEngine({ videoId, autoplay = false, onEnded, onAutoplayBlocked, onPlaybackResumed, onPlayStateChange, capSeconds, onPlaybackCapped }, ref) {
  const wrapperRef = useRef(null)
  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const usingNativeHlsRef = useRef(false)
  // Read at the moment the mount effect's dynamic import('hls.js')
  // resolves, not closed over at mount time (same reasoning as
  // latestVideoIdRef below).
  const autoplayRef = useRef(autoplay)
  autoplayRef.current = autoplay
  const onEndedRef = useRef(onEnded)
  const onAutoplayBlockedRef = useRef(onAutoplayBlocked)
  const onPlaybackResumedRef = useRef(onPlaybackResumed)
  // Phase 4C: reports actual play/stop state (true only while genuinely
  // playing -- not paused, not buffering, not ended), independent of the
  // autoplay-watchdog machinery above. Optional -- no caller passes this
  // yet, so it's inert until a future phase wires a consumer.
  const onPlayStateChangeRef = useRef(onPlayStateChange)
  // Trial / Visitor Gating (Phase 4E). capSeconds undefined/null means
  // "no cap, full playback" -- the common case (Trial member, admin, or
  // any YouTube-provider Module, which never reaches this engine's
  // sibling at all). Set means "pause and clamp at this position,"
  // enforced below purely from the <video> element's own position, not
  // from anything time-based -- see enforceCap().
  const capSecondsRef = useRef(capSeconds)
  const onPlaybackCappedRef = useRef(onPlaybackCapped)
  // Same role as YouTubeVideoEngine's watchingAutoplayRef: armed right
  // before a src swap (never on first load), cleared by whichever comes
  // first — a real `playing`/`pause` event, or the watchdog backstop.
  const watchingAutoplayRef = useRef(false)
  const watchdogTimerRef = useRef(null)
  // Kept in sync on every render so the mount effect's dynamic
  // import('hls.js').then() callback (below) can read the *current*
  // videoId at the moment it resolves, not whatever videoId was closed
  // over at mount time — the import can take a render or two, and a
  // Module transition could in principle happen before it settles.
  const latestVideoIdRef = useRef(videoId)
  latestVideoIdRef.current = videoId

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

  const clearAutoplayWatchdog = () => {
    if (watchdogTimerRef.current !== null) {
      clearTimeout(watchdogTimerRef.current)
      watchdogTimerRef.current = null
    }
  }

  // Mount: create exactly one playback path (native or hls.js) for this
  // component's lifetime. Src changes are handled by the separate effect
  // below via loadSource()/video.src — never by tearing this one down and
  // remounting, which is what caused the POC's mediaSourceRequiresReset /
  // "play() interrupted by a new load request" errors (a second Hls
  // instance getting attached to the same <video> before the first one
  // was destroyed).
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let cancelled = false

    if (isRealSafari && video.canPlayType('application/vnd.apple.mpegurl')) {
      usingNativeHlsRef.current = true
      return
    }

    import('hls.js').then(({ default: Hls }) => {
      if (cancelled) return

      if (!Hls.isSupported()) {
        // No native HLS and hls.js reports the browser can't do MSE-based
        // HLS either — nothing more this engine can do. Not expected on
        // any evergreen browser Luckster targets today.
        return
      }

      usingNativeHlsRef.current = false
      const hls = new Hls()
      hlsRef.current = hls

      hls.on(Hls.Events.ERROR, (_evt, data) => {
        // Non-fatal errors (buffer stalls, aborted segment requests from
        // a src swap, etc.) are expected and self-recovered by hls.js —
        // observed repeatedly in POC testing without breaking playback.
        // Only fatal errors need surfacing, and even then there is no
        // existing UI affordance for a hard playback failure in this
        // engine (same as YouTubeVideoEngine has none) — that's an
        // existing gap in the Player, not something introduced here.
        if (!data.fatal) return
        console.error('[HlsVideoEngine] fatal hls.js error', data.type, data.details, data)
      })

      hls.attachMedia(video)
      hls.loadSource(latestVideoIdRef.current)

      // Only on a freshly-mounted Engine after a cross-provider Module
      // transition (see VideoModule.jsx's hasStartedRef) — the Practice's
      // genuine first video stays cued until the user's own 播放 click,
      // matching the native-HLS branch's existing first-load behavior
      // (that branch calls .play() unconditionally, but silently loses to
      // the browser's autoplay policy when there's no prior gesture).
      if (autoplayRef.current) {
        video.play().catch(() => {})
      }
    })

    return () => {
      cancelled = true
      clearAutoplayWatchdog()
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
    // Intentionally mount-only ([] deps) — see comment above the effect.
  }, [])

  // Src changes (Module transitions). Skips the very first render for
  // each playback path, since that initial load is handled by the setup
  // effect above (native: sets .src directly the first time it becomes
  // available; hls.js: loadSource() in the mount effect already covers
  // it).
  const isFirstSrcRef = useRef(true)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isFirstSrcRef.current) {
      isFirstSrcRef.current = false
      if (usingNativeHlsRef.current) {
        video.src = videoId
        video.play().catch(() => {
          // Autoplay blocked on first load is expected/normal — the
          // Player's own "播放" button is what actually starts playback,
          // same as YouTubeVideoEngine's cued-but-not-playing first load.
        })
      }
      return
    }

    // Inlined (rather than a shared helper function) to match
    // YouTubeVideoEngine's equivalent arming logic and keep this effect's
    // dependency list exhaustive-deps-clean without needing a disable
    // comment — see that file's analogous [videoId] effect.
    watchingAutoplayRef.current = true
    clearAutoplayWatchdog()
    watchdogTimerRef.current = setTimeout(() => {
      watchdogTimerRef.current = null
      if (!watchingAutoplayRef.current) return
      watchingAutoplayRef.current = false
      onAutoplayBlockedRef.current?.()
    }, AUTOPLAY_WATCHDOG_MS)

    if (usingNativeHlsRef.current) {
      video.src = videoId
      video.load()
    } else if (hlsRef.current) {
      hlsRef.current.loadSource(videoId)
    } else {
      // hls.js hasn't finished its dynamic import yet — extremely narrow
      // window right after mount. Nothing to do; the mount effect's
      // loadSource(videoId) call will already pick up the current
      // videoId once it resolves.
      return
    }

    video.play().catch(() => {
      // Handled via the playing/pause watchdog below, same pattern as
      // YouTubeVideoEngine's PAUSED handling.
    })
  }, [videoId])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    function handleEnded() {
      watchingAutoplayRef.current = false
      clearAutoplayWatchdog()
      onPlayStateChangeRef.current?.(false)
      onEndedRef.current()
    }

    function handlePlaying() {
      onPlayStateChangeRef.current?.(true)

      if (!watchingAutoplayRef.current) return
      watchingAutoplayRef.current = false
      clearAutoplayWatchdog()
      onPlaybackResumedRef.current?.()
    }

    function handlePause() {
      onPlayStateChangeRef.current?.(false)

      if (!watchingAutoplayRef.current) return
      watchingAutoplayRef.current = false
      clearAutoplayWatchdog()
      onAutoplayBlockedRef.current?.()
    }

    // Phase 4C: buffering counts as "not playing" for onPlayStateChange
    // (matches the confirmed Trial usage rule -- buffering never counts),
    // even though the video isn't paused. Doesn't touch the autoplay-
    // watchdog machinery, which has no equivalent concern.
    function handleWaiting() {
      onPlayStateChangeRef.current?.(false)
    }

    // Trial / Visitor Gating (Phase 4E). Position-based, not time-based
    // -- capSecondsRef reaching or being exceeded by currentTime is the
    // only condition checked, regardless of how currentTime got there
    // (normal playback, a drag on the native seek bar, or capSeconds
    // itself just changing out from under an already-playing video, e.g.
    // a Trial expiring mid-Module -- see useModuleUsageTracking's
    // refreshProfile() call). Always clamping back to exactly capSeconds
    // (not just pausing) closes the seek-within-buffered-range hole: a
    // native <video> lets you scrub freely inside whatever's already
    // downloaded without a new network request, so pausing alone
    // wouldn't stop rewatching/skipping around inside the first 10s or
    // (right after a Trial expires) inside whatever was already buffered
    // past it.
    function enforceCap() {
      const cap = capSecondsRef.current
      if (cap == null || video.currentTime < cap) return

      if (video.currentTime > cap) video.currentTime = cap

      if (!video.paused) {
        video.pause()
        onPlaybackCappedRef.current?.()
      }
    }

    video.addEventListener('ended', handleEnded)
    video.addEventListener('playing', handlePlaying)
    video.addEventListener('pause', handlePause)
    video.addEventListener('waiting', handleWaiting)
    video.addEventListener('timeupdate', enforceCap)
    video.addEventListener('seeked', enforceCap)

    return () => {
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('playing', handlePlaying)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('waiting', handleWaiting)
      video.removeEventListener('timeupdate', enforceCap)
      video.removeEventListener('seeked', enforceCap)
    }
  }, [])

  useImperativeHandle(ref, () => ({
    play() {
      videoRef.current?.play().catch(() => {})
    },
    pause() {
      videoRef.current?.pause()
    },
    requestFullscreen() {
      // Same approach as YouTubeVideoEngine: fullscreens the stable
      // wrapper div (never the <video> itself), only ever called from a
      // direct click handler, never automatically.
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
      <video ref={videoRef} className="video-player-frame" playsInline controls />
    </div>
  )
})

export default HlsVideoEngine
