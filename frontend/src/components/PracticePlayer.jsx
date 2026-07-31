import { useState } from 'react'
import { Link } from 'react-router-dom'
import ModuleRenderer from './ModuleRenderer'

function PracticePlayer({ practice, modules }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const isComplete = currentIndex >= modules.length

  const goNext = () => {
    setCurrentIndex((index) => Math.min(index + 1, modules.length))
  }

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0))
  }

  const restart = () => {
    setCurrentIndex(0)
  }

  return (
    <div className="practice-player">
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
            key={modules[currentIndex].slug}
            module={modules[currentIndex]}
            onEnded={goNext}
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
