import { Link } from 'react-router-dom'

// Homepage Section Order Plan (2026-09): the closing CTA, placed after the
// trust cluster (About/Founder → Social Proof) as the terminus of the
// visitor decision path. Mirrors the Hero's two CTAs -- 免費體驗 (primary,
// free sign-up / trial) and 訂閱會員 (secondary, subscribe).
//
// Payment Readiness Implementation Sprint (2026-09): 訂閱會員 now points
// at /pricing (was /login, same as 免費體驗). 免費體驗 keeps its existing
// /login behaviour -- unchanged, per Sprint scope.
//
// Website Refinement (2026-10): the secondary button now reads 購買方案
// (was 訂閱會員) so it doesn't suggest an automatic recurring charge;
// same /pricing link.
function FinalCtaSection() {
  return (
    <section className="home-final-cta">
      <h2>現在就開始</h2>

      <div className="home-final-cta-buttons">
        <Link to="/login" className="button">
          免費體驗
        </Link>

        <Link to="/pricing" className="button secondary">
          購買方案
        </Link>
      </div>
    </section>
  )
}

export default FinalCtaSection
