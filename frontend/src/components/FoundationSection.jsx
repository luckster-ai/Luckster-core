import FoundationCard from './FoundationCard'

function FoundationSection({ foundations }) {
  return (
    <section className="foundations">
      <h2>新手必修 <span className="free-badge">免費</span></h2>

      <p className="section-description">
        開始任何練習前，請先完成新手必修，
        建立安全且穩固的練習基礎。所有人都能免費觀看，不需要註冊。
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