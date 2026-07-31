import { useRef } from 'react'
import VideoPlayer from './VideoPlayer'

function VideoModule({ module, onEnded }) {
  const playerRef = useRef(null)

  return (
    <div className="module-playback">
      <h3>{module.chineseTitle}</h3>

      <p className="module-playback-subtitle">{module.title}</p>

      <VideoPlayer
        ref={playerRef}
        videoId={module.videoReference.videoId}
        onEnded={onEnded}
      />

      <div className="playback-controls">
        <button onClick={() => playerRef.current?.play()}>
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
