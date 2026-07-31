import { useEffect, useState } from 'react'

const PLACEHOLDER_DELAY_MS = 3000

function ModulePlaceholder({ module, onEnded }) {
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(PLACEHOLDER_DELAY_MS / 1000)
  )

  useEffect(() => {
    const timer = setTimeout(onEnded, PLACEHOLDER_DELAY_MS)

    const countdown = setInterval(() => {
      setSecondsLeft((value) => Math.max(value - 1, 0))
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(countdown)
    }
  }, [module, onEnded])

  return (
    <div className="module-playback module-placeholder">
      <h3>{module.chineseTitle}</h3>

      <p className="module-playback-subtitle">{module.title}</p>

      <p>{module.description}</p>

      <p className="module-placeholder-note">
        影片內容尚未上線，{secondsLeft} 秒後自動進入下一個 Module。
      </p>
    </div>
  )
}

export default ModulePlaceholder
