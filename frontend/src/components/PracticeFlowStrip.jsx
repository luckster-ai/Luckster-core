import { SECTIONS } from '../utils/practiceStructure'

// Sprint 2B: explanatory, non-interactive six-phase strip -- "一套完整練習
// 由這些階段組成", not a picker (see brief section 7: "It is NOT six
// buttons").
//
// Labels are sourced from practiceStructure.SECTIONS (the Practice
// Builder's single source of truth), not from homepage.practiceFlow.steps.
// That data's raw labels ("熱身", "奎亞") predate the terminology the
// Builder and Practice Hub have since settled on ("暖身", "體式" -- see
// practices.js's own description field, and the zhLabel derivation already
// used in PracticeCompositionOverview.jsx, which this follows). Only the
// section title comes from homepage.practiceFlow.title, since that copy
// has no such drift.
function PracticeFlowStrip({ title }) {
  return (
    <section className="practice-flow-strip-section">
      <h2>{title}</h2>

      <p className="practice-flow-strip-lead">一套完整練習，由這六個階段組成。</p>

      <ol className="practice-flow-strip">
        {SECTIONS.map((section, index) => {
          const zhLabel = section.label.split(' ')[0]
          const isLast = index === SECTIONS.length - 1

          return (
            <li key={section.key} className="practice-flow-item">
              <span className={`practice-flow-step practice-flow-step--${section.key}`}>
                <span className="practice-flow-step-num">{index + 1}</span>
                <span className="practice-flow-step-label">{zhLabel}</span>
              </span>

              {!isLast && <span className="practice-flow-connector" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default PracticeFlowStrip
