import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ModuleRenderer from './ModuleRenderer'
import { useAuth } from '../state/useAuth'
import { startPracticeSession, completePracticeSession } from '../state/practiceActivityStore'

// initialModuleIndex / initialPositionSeconds / resumeSessionId are set
// only when PracticePlayerPage decided this is a Resume (Phase 5E) --
// otherwise they take their defaults and this behaves exactly as before:
// start at Module 1, no seeded session.
function PracticePlayer({
  practice,
  modules,
  initialModuleIndex = 0,
  initialPositionSeconds = 0,
  resumeSessionId = null
}) {
  const { user } = useAuth()

  const startIndex = Math.min(Math.max(0, initialModuleIndex), Math.max(0, modules.length - 1))
  const [currentIndex, setCurrentIndex] = useState(startIndex)
  // The resumed position applies to exactly one Module render -- the one
  // the viewer left off in, before any navigation. Cleared on the first
  // 下一個 / 上一個 / 再練習一次 so it can never re-seek later (e.g. a
  // restart that lands back on the same index).
  const [resumePending, setResumePending] = useState(Boolean(resumeSessionId))
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
  // no-ops against the guard below.
  //
  // On a Resume (Phase 5E) the ref is seeded with the existing session id
  // so that first onPlaybackStarted no-ops and the unfinished row is
  // reused, not duplicated. `sessionId` state mirrors the ref so
  // VideoModule's progress saver re-renders with it once an insert lands;
  // the ref stays the synchronous source of truth for the guard.
  const sessionIdRef = useRef(resumeSessionId)
  const [sessionId, setSessionId] = useState(resumeSessionId)
  // Guards startSession so one attempt only ever lands one row, no matter
  // how many paths call it (onPlaybackStarted, restart(), a re-mounted
  // VideoModule after restart). Cleared once the insert resolves.
  const sessionStartPendingRef = useRef(false)

  const startSession = () => {
    if (!user) return
    if (sessionIdRef.current || sessionStartPendingRef.current) return

    sessionStartPendingRef.current = true
    startPracticeSession(user.id, practice.id, modules.map((module) => module.id)).then(
      (newSessionId) => {
        sessionIdRef.current = newSessionId
        sessionStartPendingRef.current = false
        setSessionId(newSessionId)
      }
    )
  }

  useEffect(() => {
    if (!isComplete || !sessionIdRef.current) return
    completePracticeSession(sessionIdRef.current)
    sessionIdRef.current = null
    setSessionId(null)
  }, [isComplete])

  const goNext = () => {
    setResumePending(false)
    setCurrentIndex((index) => Math.min(index + 1, modules.length))
  }

  const goPrevious = () => {
    setResumePending(false)
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const restart = () => {
    setResumePending(false)
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
            progressSessionId={sessionId}
            progressModuleIndex={currentIndex}
            initialPositionSeconds={
              resumePending && currentIndex === startIndex ? initialPositionSeconds : 0
            }
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
