import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import VideoPlayer from './VideoPlayer'
import { useModuleUsageTracking } from '../hooks/useModuleUsageTracking'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus } from '../utils/membershipStatus'
import { getModuleCapSeconds } from '../utils/playbackEntitlement'

function VideoModule({ module, onEnded, onImmersiveStart }) {
  const { profile, refreshProfile } = useAuth()
  const membershipStatus = getMembershipStatus(profile)
  const capSeconds = getModuleCapSeconds({ membershipStatus, provider: module.videoReference.provider })

  // Phase 4E: catches a Trial that expired purely from the 30-day clock
  // while this member was doing something other than watching a Bunny
  // Module (browsing Foundations, idle) -- there's no heartbeat to hang
  // this off of in that case, so it's checked once per Module instead,
  // here at the point a fresh capSeconds decision is about to be made.
  // Ref, not a direct dependency -- refreshProfile is a new function
  // identity every AuthProvider render; without the ref this would
  // refire on every VideoModule render, not just on a real Module
  // change (see useModuleUsageTracking.js for the identical reasoning).
  const refreshProfileRef = useRef(refreshProfile)
  useEffect(() => {
    refreshProfileRef.current = refreshProfile
  }, [refreshProfile])
  useEffect(() => {
    refreshProfileRef.current()
  }, [module.id])

  const playerRef = useRef(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [showCappedNotice, setShowCappedNotice] = useState(false)
  const [trackedSlug, setTrackedSlug] = useState(module.slug)
  // Phase 4D: mirrors the player's real play/stop state so
  // useModuleUsageTracking below always sees the current Module's actual
  // state, never a stale one left over from whichever Module played
  // before it -- see the trackedSlug reset block a few lines down.
  const [isPlaying, setIsPlaying] = useState(false)
  // Real browser Fullscreen API + the Practice-level immersive
  // presentation are both only ever requested from this one first-play
  // click — never re-requested automatically on later Modules (see
  // onImmersiveStart in PracticePlayer.jsx and requestFullscreen() in
  // VideoPlayer.jsx). Repeat manual 播放 clicks after this just resume
  // playback, nothing else. State (not a ref) because it also decides the
  // `autoplay` prop below: a freshly-mounted Engine after a cross-provider
  // Module transition (VideoPlayer.jsx swaps Engine type by provider)
  // needs to know this isn't the Practice's genuine first video.
  const [hasStarted, setHasStarted] = useState(false)

  // A Module transition's autoplay outcome only applies to that one
  // transition — reset during render (not an effect, so it doesn't cause
  // an extra commit) so a stale prompt from the previous Module can never
  // linger into this one. Not a `key`-based remount: VideoModule must stay
  // mounted across Modules so the same VideoPlayer/YT.Player instance
  // survives loadVideoById() transitions — the real Fullscreen API session
  // does NOT reliably survive it (YouTube's own player exits it on mobile
  // when the video changes), which is exactly why the Practice-level
  // immersive presentation exists as a separate, CSS-only layer that
  // doesn't depend on that session staying alive.
  if (trackedSlug !== module.slug) {
    setTrackedSlug(module.slug)
    setShowResumePrompt(false)
    // Without this, a manual Module switch while still playing (the
    // "下一個 Module" button, not a natural onEnded) would briefly pair
    // the NEW module.id with the OLD isPlaying=true from this same
    // render -- useModuleUsageTracking would start a session for a
    // Module that hasn't actually started playing yet. Resetting here,
    // at render time rather than in an effect, means the pairing is
    // never even momentarily wrong.
    setIsPlaying(false)
    // Same reasoning, Phase 4E: a capped notice left over from the
    // previous (visitor/expired-access) Module must not silently carry
    // into a new one this member DOES have full access to.
    setShowCappedNotice(false)
  }

  useModuleUsageTracking({
    moduleId: module.id,
    provider: module.videoReference.provider,
    isPlaying
  })

  return (
    <div className="module-playback">
      <h3>{module.chineseTitle}</h3>

      <p className="module-playback-subtitle">{module.title}</p>

      <VideoPlayer
        ref={playerRef}
        provider={module.videoReference.provider}
        videoId={module.videoReference.videoId}
        autoplay={hasStarted}
        onEnded={onEnded}
        onAutoplayBlocked={() => setShowResumePrompt(true)}
        onPlaybackResumed={() => setShowResumePrompt(false)}
        onPlayStateChange={setIsPlaying}
        capSeconds={capSeconds}
        onPlaybackCapped={() => setShowCappedNotice(true)}
      />

      {showResumePrompt && (
        <div className="video-resume-prompt">
          <button
            onClick={() => {
              playerRef.current?.play()
              setShowResumePrompt(false)
            }}
          >
            繼續播放
          </button>
        </div>
      )}

      {showCappedNotice && (
        <div className="video-capped-notice">
          <p>訪客與試用期已結束的會員，每個 Module 僅能試看 10 秒。</p>
          <Link to="/account">登入或查看會員狀態</Link>
        </div>
      )}

      <div className="playback-controls">
        <button
          onClick={() => {
            playerRef.current?.play()
            if (!hasStarted) {
              setHasStarted(true)
              playerRef.current?.requestFullscreen()
              onImmersiveStart?.()
            }
          }}
        >
          播放
        </button>

        <button onClick={() => playerRef.current?.pause()}>
          暫停
        </button>
      </div>
    </div>
  )
}

export default VideoModule
