import { Link } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import pricing from '../data/pricing'

// Payment Readiness Implementation Sprint (2026-09).
//
// Public /pricing page -- the destination for the Hero/Final CTA
// "訂閱會員" button (previously pointed at /login, indistinguishable
// from "免費體驗"). Purpose: let a visitor (and an ECPay/PAYUNi
// reviewer) find price, Trial rules and renewal/refund terms without
// logging in first. All copy comes from data/pricing.js, which is
// transcribed from already-confirmed rules (see that file's header) --
// nothing here is a new product decision.
//
// This Sprint does not build a live checkout: the Payment Core
// (create-order-checkout) has no Provider Adapter wired to it yet, and
// wiring one is explicitly out of scope. The CTA below routes into the
// real, already-implemented next step instead of a non-functional "buy"
// button: a signed-in visitor is sent to /contract-review (Step 4,
// live), a signed-out visitor is sent to /login to start their Trial.
function PricingPage() {
  const { loading, user } = useAuth()

  return (
    <div className="pricing-page">
      <h1>方案與價格</h1>
      <p className="subtitle">
        免費試用 30 天，準備好之後再決定是否成為正式付費會員——沒有隱藏費用，試用期間不會被收費。
      </p>

      <div className="pricing-plans cards">
        {pricing.plans.map((plan) => (
          <div className="card pricing-plan-card" key={plan.code}>
            <h2>{plan.name}</h2>
            <p className="pricing-plan-name-en">{plan.nameEn}</p>
            <p className="pricing-plan-price">{plan.price}</p>
            <p className="pricing-plan-period">{plan.period}</p>
          </div>
        ))}
      </div>

      <section className="pricing-note-section">
        <h2>{pricing.trial.title}</h2>
        <ul>
          {pricing.trial.limits.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>{pricing.trial.usageNote}</p>
        <p>{pricing.trial.noImmediateCharge}</p>
      </section>

      <section className="pricing-note-section">
        <h2>{pricing.renewal.title}</h2>
        <p>{pricing.renewal.summary}</p>
        <Link to="/legal/cancellation">完整說明見取消／續購政策 →</Link>
      </section>

      <section className="pricing-note-section">
        <h2>{pricing.refund.title}</h2>
        <p>{pricing.refund.summary}</p>
        <Link to="/legal/refund">完整退款計算方式見退款政策 →</Link>
      </section>

      <div className="pricing-cta">
        {!loading && user && (
          <Link to="/contract-review" className="button">
            準備好了，開始契約審閱
          </Link>
        )}
        {!loading && !user && (
          <Link to="/login" className="button">
            先免費試用 30 天
          </Link>
        )}
        <Link to="/legal/terms" className="button secondary">
          查看完整會員服務契約
        </Link>
      </div>
    </div>
  )
}

export default PricingPage
