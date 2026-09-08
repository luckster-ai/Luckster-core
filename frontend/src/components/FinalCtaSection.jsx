import { Link } from 'react-router-dom'

// Homepage Section Order Plan (2026-09): the closing CTA, placed after the
// trust cluster (About/Founder → Social Proof) as the terminus of the
// visitor decision path. Mirrors the Hero's two CTAs -- 免費體驗 (primary,
// free sign-up / trial) and 訂閱會員 (secondary, subscribe). Like the Hero,
// both point at /login for now: Payment destination is out of scope for
// this round, so current login behaviour is retained.
function FinalCtaSection() {
  return (
    <section className="home-final-cta">
      <h2>現在就開始</h2>

      <div className="home-final-cta-buttons">
        <Link to="/login" className="button">
          免費體驗
        </Link>

        <Link to="/login" className="button secondary">
          訂閱會員
        </Link>
      </div>
    </section>
  )
}

export default FinalCtaSection
