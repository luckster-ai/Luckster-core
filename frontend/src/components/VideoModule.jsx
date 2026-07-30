import { useRef } from 'react'
import VideoPlayer from './VideoPlayer'

function VideoModule({ module, onEnded }) {
  const playerRef = useRef(null)

  return (
    <div className="module-playback">
      <h3>{module.title}</h3>

      <VideoPlayer
        ref={playerRef}
        videoId={module.videoReference.videoId}
        onEnded={onEnded}
      />

      <div className="playback-controls">
        <button onClick={() => playerRef.current?.play()}>
          Play
        </button>

        <button onClick={() => playerRef.current?.pause()}>
          Pause
        </button>
      </div>
    </div>
  )
}

export default VideoModule
