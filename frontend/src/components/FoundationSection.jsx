import FoundationCard from './FoundationCard'

function FoundationSection({ foundations }) {
  return (
    <section className="foundations">
      <h2>新手必修 Foundation</h2>

      <p className="section-description">
        開始任何 Practice 前，請先完成 Foundation，
        建立安全且穩固的練習基礎。
      </p>

      <div className="cards">
        {foundations.map((foundation) => (
          <FoundationCard
            key={foundation.id}
            foundation={foundation}
          />
        ))}
      </div>
    </section>
  )
}

export default FoundationSection