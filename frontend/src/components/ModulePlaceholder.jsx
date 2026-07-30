import { useEffect } from 'react'

const PLACEHOLDER_DELAY_MS = 3000

function ModulePlaceholder({ module, onEnded }) {
  useEffect(() => {
    const timer = setTimeout(onEnded, PLACEHOLDER_DELAY_MS)

    return () => clearTimeout(timer)
  }, [module, onEnded])

  return (
    <div className="module-playback module-placeholder">
      <h3>{module.title}</h3>

      <p>此 Module 尚未提供影片內容（Prototype 佔位畫面，將自動繼續下一步）。</p>
    </div>
  )
}

export default ModulePlaceholder
