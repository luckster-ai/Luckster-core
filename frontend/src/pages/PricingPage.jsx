import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import pricing from '../data/pricing'
import { canOfferPurchase, getContractAcceptanceState } from '../utils/purchaseEligibility'

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
//
// Step 11.1 (Renewal Purchase Entry): a signed-in member who already has a
// Contract Acceptance is sent to /account (where the plan buttons are)
// instead -- /contract-review would otherwise be their first step into a
// fresh 3-day review, which renewal does not require (契約第九條第五項). If
// the acceptance state cannot be read, /account is used too, never the
// review.
//
// Step 11 (Production Purchase Entry): the contract review / checkout flow
// is shown only when VITE_ENABLE_PURCHASE === 'true' (set on Preview for
// TEST). Unset (Production, until payments launch) a signed-in member gets
// a "not open yet" note and /account instead of /contract-review, and the
// acceptance state is not read.
const PURCHASE_ENABLED = import.meta.env.VITE_ENABLE_PURCHASE === 'true'

// Step 11 (Pricing contract entry): exactly one contract entry button,
// chosen by member state -- 'terms' (/legal/terms, read only), 'review'
// (/contract-review) or null (none yet). With the purchase flow off
// (Production) /legal/terms is always offered: it is the page's only public
// contract entry. With it on:
// - signed out -> 'terms'
// - signed in, still loading (profile / acceptance state) -> null
// - no purchase eligibility (e.g. a current paid Service Period) -> 'terms'
// - eligible, not yet accepted -> 'review' (labelled 繼續契約審閱 once a
//   review is pending; start_contract_review() keeps the existing
//   review_presented_at, so re-entering never restarts the 3 days)
// - eligible, accepted -> null: the /account purchase button is the entry
// - acceptance state unreadable -> 'terms' (never the review)
function getContractEntry({ loading, user, profile, contractAccepted }) {
  if (!PURCHASE_ENABLED) return 'terms'
  if (loading) return null
  if (!user) return 'terms'
  if (!profile || contractAccepted === undefined) return null
  if (!canOfferPurchase(profile)) return 'terms'
  if (contractAccepted === false) return 'review'
  if (contractAccepted === null) return 'terms'
  return null
}

function PricingPage() {
  const { loading, user, profile } = useAuth()
  // undefined = not loaded yet, null = could not be read
  const [contractAccepted, setContractAccepted] = useState(undefined)

  useEffect(() => {
    if (!PURCHASE_ENABLED || loading || !user) return undefined

    let cancelled = false
    getContractAcceptanceState().then((accepted) => {
      if (!cancelled) setContractAccepted(accepted)
    })
    return () => {
      cancelled = true
    }
  }, [loading, user])

  const contractEntry = getContractEntry({ loading, user, profile, contractAccepted })

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

      {!PURCHASE_ENABLED && !loading && user && (
        <section className="pricing-note-section">
          <h2>付費方案</h2>
          <p>付費方案即將開放，目前可先使用免費體驗。</p>
        </section>
      )}

      <div className="pricing-cta">
        {contractEntry === 'review' && (
          <Link to="/contract-review" className="button">
            {profile.review_presented_at ? '繼續契約審閱' : '準備好了，開始契約審閱'}
          </Link>
        )}
        {PURCHASE_ENABLED && !loading && user && (contractAccepted === true || contractAccepted === null) && (
          <Link to="/account" className="button">
            {contractAccepted && canOfferPurchase(profile) ? '已完成契約同意，前往我的帳號購買' : '前往我的帳號'}
          </Link>
        )}
        {!PURCHASE_ENABLED && !loading && user && (
          <Link to="/account" className="button">
            前往我的帳號
          </Link>
        )}
        {!loading && !user && (
          <Link to="/login" className="button">
            先免費試用 30 天
          </Link>
        )}
        {contractEntry === 'terms' && (
          <Link to="/legal/terms" className="button secondary">
            查看完整會員服務契約
          </Link>
        )}
      </div>
    </div>
  )
}

export default PricingPage
