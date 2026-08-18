import { Link } from 'react-router-dom'
import PracticeCard from './PracticeCard'

// Sprint 2A: /practice becomes a real Practice Hub with three sections
// -- 官方練習, 我的練習, 建立新練習 -- per the Practice Hub UX audit's
// recommended Option A (single hub, no new routes/tabs). "Official
// Guidance First": 官方練習 comes first and is the visually primary
// section; 我的練習 is clearly discoverable but secondary; 建立新練習
// stays a calm, small CTA rather than competing for attention.
function PracticeHub({ officialPractices, customPractices }) {
  const hasCustomPractices = customPractices.length > 0

  return (
    <section className="practice-hub">
      <h1>開始練習</h1>

      <p className="section-description">
        選擇一堂官方練習，或找到你先前建立的練習，開始今天的 Kundalini Yoga 練習。
      </p>

      <div className="practice-hub-section">
        <h2>官方練習</h2>

        <div className="cards">
          {officialPractices.map((practice) => (
            <PracticeCard key={practice.id} practice={practice} />
          ))}
        </div>
      </div>

      <div className="practice-hub-section">
        <h2>我的練習</h2>

        {hasCustomPractices ? (
          <div className="cards">
            {customPractices.map((practice) => (
              <PracticeCard key={practice.id} practice={practice} isCustom />
            ))}
          </div>
        ) : (
          <div className="practice-hub-empty">
            <p>目前還沒有自己建立的練習。建立一堂專屬於你的 Practice，之後會顯示在這裡。</p>

            <Link to="/practice/build" className="button secondary">
              建立新練習
            </Link>
          </div>
        )}
      </div>

      {hasCustomPractices && (
        <div className="practice-hub-create">
          <Link to="/practice/build" className="button secondary">
            ＋ 建立新練習
          </Link>
        </div>
      )}
    </section>
  )
}

export default PracticeHub
