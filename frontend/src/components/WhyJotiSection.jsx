import about from '../data/about'

// Homepage First Refinement (2026-09): Why JOTI is now a deliberately
// minimal three-part block -- heading, one lead line, and the ABC triad.
// The ABC letters/labels are reused from /about's `why-abc` section, not
// duplicated copy. The teacher's KRI credential and the "不需要柔軟…" note
// that used to sit here have moved out this round: the credential belongs
// with the About / Trust story, and that note is now the Hero's pre-CTA
// line -- keeping either here would just repeat it.
const whyAbc = about.find((section) => section.id === 'why-abc')

function WhyJotiSection() {
  return (
    <section className="why-joti">
      <h2>為什麼是 JOTI</h2>

      <p className="why-joti-lead">複雜的昆達里尼瑜伽，從三個簡單入口開始。</p>

      <div className="about-abc">
        {whyAbc.abc.map((item) => (
          <div className="about-abc-item" key={item.letter}>
            <span className="about-abc-letter">{item.letter}</span>
            <span className="about-abc-label">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default WhyJotiSection
