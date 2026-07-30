import { useState } from 'react'
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

  return (
    <div className="practice-player">
      <section className="practice-player-header">
        <h1>{practice.title}</h1>

        <p>{practice.description}</p>
      </section>

      <section className="practice-player-progress">
        {isComplete ? (
          <p>已完成 {modules.length} / {modules.length} 個 Module</p>
        ) : (
          <p>
            目前進度：第 {currentIndex + 1} / {modules.length} 個 Module —{' '}
            {modules[currentIndex].title}
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
              {module.title}
            </li>
          ))}
        </ol>
      </section>

      {isComplete ? (
        <section className="practice-complete">
          <h2>Practice Complete</h2>

          <p>你已完成整堂 Practice。</p>
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
          Previous Module
        </button>

        <button onClick={goNext} disabled={isComplete}>
          Next Module
        </button>
      </section>
    </div>
  )
}

export default PracticePlayer
