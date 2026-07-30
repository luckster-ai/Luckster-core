import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import loadYouTubeIframeAPI from '../utils/loadYouTubeIframeAPI'

const VideoPlayer = forwardRef(function VideoPlayer({ videoId, onEnded }, ref) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)

  useEffect(() => {
    let isMounted = true

    loadYouTubeIframeAPI().then((YT) => {
      if (!isMounted || !containerRef.current) return

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        events: {
          onStateChange(event) {
            if (event.data === YT.PlayerState.ENDED) {
              onEnded()
            }
          }
        }
      })
    })

    return () => {
      isMounted = false

      if (playerRef.current) {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [videoId, onEnded])

  useImperativeHandle(ref, () => ({
    play() {
      playerRef.current?.playVideo()
    },
    pause() {
      playerRef.current?.pauseVideo()
    }
  }))

  return (
    <div className="video-player">
      <div ref={containerRef} className="video-player-frame" />
    </div>
  )
})

export default VideoPlayer
