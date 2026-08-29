import { forwardRef } from 'react'
import YouTubeVideoEngine from './YouTubeVideoEngine'
import HlsVideoEngine from './HlsVideoEngine'

// Provider dispatcher (2026-08-21, Bunny-ready prep). Deliberately just an
// if/else, not a registry or factory — there are exactly two engines and
// no evidence yet that a third is imminent; add one the same way if that
// changes. External interface (props in, imperative handle out) is
// unchanged from before this split, so VideoModule.jsx / LessonDetail.jsx
// don't need to know which engine is actually rendering.
//
// provider defaults to 'youtube' so any caller that hasn't been updated
// to pass it keeps working exactly as before — matters today because all
// 43 existing videoReferences are `{ provider: 'youtube', videoId }`.
const VideoPlayer = forwardRef(function VideoPlayer(
  { provider = 'youtube', videoId, autoplay = false, onEnded, onAutoplayBlocked, onPlaybackResumed, onPlayStateChange },
  ref
) {
  const Engine = provider === 'bunny' ? HlsVideoEngine : YouTubeVideoEngine

  return (
    <Engine
      ref={ref}
      videoId={videoId}
      autoplay={autoplay}
      onEnded={onEnded}
      onAutoplayBlocked={onAutoplayBlocked}
      onPlaybackResumed={onPlaybackResumed}
      onPlayStateChange={onPlayStateChange}
    />
  )
})

export default VideoPlayer
