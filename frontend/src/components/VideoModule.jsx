import { useRef, useState } from 'react'
import VideoPlayer from './VideoPlayer'

function VideoModule({ module, onEnded, onImmersiveStart }) {
  const playerRef = useRef(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const [trackedSlug, setTrackedSlug] = useState(module.slug)
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
  }

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
