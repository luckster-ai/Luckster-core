import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ModuleRenderer from './ModuleRenderer'
import { useAuth } from '../state/useAuth'
import { startPracticeSession, completePracticeSession } from '../state/practiceActivityStore'

function PracticePlayer({ practice, modules }) {
  const { user } = useAuth()
  const [currentIndex, setCurrentIndex] = useState(0)
  // Practice-level, presentation-only state — deliberately not the same
  // thing as the browser's real Fullscreen API. Entered once, from the
  // same first-play gesture that already requests real fullscreen, and
  // then left alone: Module transitions never touch it, so it keeps
  // filling the screen even if the video engine's own fullscreen session
  // gets exited underneath it (see VideoPlayer.jsx / VideoModule.jsx).
  const [immersiveMode, setImmersiveMode] = useState(false)

  const isComplete = currentIndex >= modules.length

  // Practice Activity (Phase 5B). One session per genuine attempt --
  // started when the Practice's video first actually begins playing,
  // whether via the JOTI 播放 button or the provider's own native/iframe
  // controls (both surface as VideoModule's onPlaybackStarted, fired once
  // per VideoModule mount), and explicitly again from restart() below.
  // "再練習一次" both re-mounts VideoModule (the complete screen unmounts
  // it) AND is an explicit new attempt, so restart() starts the session
  // itself and the re-mounted VideoModule's onPlaybackStarted then just
  // no-ops against the guard below. The ref (not state) holds whichever
  // session is currently open; completing consumes it (sets back to null)
  // so a stray extra isComplete transition (e.g. 上一個 Module after
  // finishing, then 下一個 Module again, without an explicit restart)
  // can't try to complete an already-finished or nonexistent session.
  const sessionIdRef = useRef(null)
  // Guards startSession so one attempt only ever lands one row, no matter
  // how many paths call it (onPlaybackStarted, restart(), a re-mounted
  // VideoModule after restart). Cleared once the insert resolves.
  const sessionStartPendingRef = useRef(false)

  const startSession = () => {
    if (!user) return
    if (sessionIdRef.current || sessionStartPendingRef.current) return

    sessionStartPendingRef.current = true
    startPracticeSession(user.id, practice.id, modules.map((module) => module.id)).then(
      (sessionId) => {
        sessionIdRef.current = sessionId
        sessionStartPendingRef.current = false
      }
    )
  }

  useEffect(() => {
    if (!isComplete || !sessionIdRef.current) return
    completePracticeSession(sessionIdRef.current)
    sessionIdRef.current = null
  }, [isComplete])

  const goNext = () => {
    setCurrentIndex((index) => Math.min(index + 1, modules.length))
  }

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const restart = () => {
    setCurrentIndex(0)
    startSession()
  }

  return (
    <div className={`practice-player${immersiveMode && !isComplete ? ' practice-player--immersive' : ''}`}>
      <section className="practice-player-header">
        <Link
          to={`/practices/${practice.slug}`}
          className="practice-player-exit"
        >
          ✕ 離開練習
        </Link>

        <h1>{practice.chineseTitle}</h1>

        <p>{practice.description}</p>
      </section>

      <section className="practice-player-progress">
        {isComplete ? (
          <p>已完成 {modules.length} / {modules.length} 個 Module</p>
        ) : (
          <p>
            目前進度：第 {currentIndex + 1} / {modules.length} 個 Module —{' '}
            {modules[currentIndex].chineseTitle}
          </p>
        )}

        <ol className="practice-player-steps">
          {modules.map((module, index) => (
            <li
              key={module.slug}
              className={
                index === currentIndex
                  ? 'current'
                  : index < currentIndex
                    ? 'completed'
                    : 'upcoming'
              }
            >
              {module.chineseTitle}
            </li>
          ))}
        </ol>
      </section>

      {isComplete ? (
        <section className="practice-complete">
          <h2>練習完成 Practice Complete</h2>

          <p>你已完成整堂 Practice。</p>

          <div className="practice-complete-actions">
            <button onClick={restart}>
              再練習一次
            </button>

            <Link to={`/practices/${practice.slug}`} className="button">
              回到課程頁面
            </Link>
          </div>
        </section>
      ) : (
        <section className="practice-player-module">
          <ModuleRenderer
            module={modules[currentIndex]}
            onEnded={goNext}
            onImmersiveStart={() => setImmersiveMode(true)}
            onPlaybackStarted={startSession}
          />
        </section>
      )}

      <section className="practice-player-controls">
        <button onClick={goPrevious} disabled={currentIndex === 0}>
          上一個 Module
        </button>

        <button onClick={goNext} disabled={isComplete}>
          下一個 Module
        </button>
      </section>
    </div>
  )
}

export default PracticePlayer
