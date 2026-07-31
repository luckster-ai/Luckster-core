import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import loadYouTubeIframeAPI from '../utils/loadYouTubeIframeAPI'

const VideoPlayer = forwardRef(function VideoPlayer({ videoId, onEnded }, ref) {
  const containerRef = useRef(null)
  const playerRef = useRef(null)
  const onEndedRef = useRef(onEnded)

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId)
      return
    }

    let isMounted = true

    loadYouTubeIframeAPI().then((YT) => {
      if (!isMounted || !containerRef.current || playerRef.current) return

      playerRef.current = new YT.Player(containerRef.current, {
        videoId,
        events: {
          onStateChange(event) {
            if (event.data === YT.PlayerState.ENDED) {
              onEndedRef.current()
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
    }
  }))

  return (
    <div className="video-player">
      <div ref={containerRef} className="video-player-frame" />
    </div>
  )
})

export default VideoPlayer
