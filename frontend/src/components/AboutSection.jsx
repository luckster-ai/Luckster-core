// Homepage About / Founder (2026-09): Trust / Connection only -- who
// brought this method and why this person. Name + short intro, no CTA.
// The "閱讀完整故事" button was removed this round; Header / Footer still
// link to /about for anyone who wants the full story.
function AboutSection({ teacher }) {
  return (
    <section id="about" className="about">
      <h2>{teacher.name}</h2>

      <p>{teacher.description}</p>
    </section>
  )
}

export default AboutSection
