import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../state/useAuth'
import { supabase } from '../lib/supabaseClient'
import { getContractContent } from '../utils/contractContent'
import { startProviderCheckout } from '../utils/startProviderCheckout'

// Payment Rebuild -- Step 4: Contract Review & Acceptance Flow.
//
// Two modes, one page (they share the same version-bound content display
// and Agree button -- only what happens on mount and what Agree calls
// differs):
//
// - 'initial' (default): the pre-payment, 3-day-gated Review Session.
//   On mount, calls start-contract-review, which pins "current applicable
//   version" the FIRST time only -- a later visit (even after a newer
//   version is published) returns the already-pinned version untouched.
//   Agree calls agree-to-contract, which independently re-validates the
//   3-day minimum server-side; the disabled state below is UX only.
//
// - 'reacceptance': for an existing member asked to reaccept a version
//   with requires_reacceptance = true (Step 8 decides WHEN to route a
//   member here -- this page does not make that decision). No pinning,
//   no 3-day wait: it reads contract_versions directly (public RLS read,
//   no side effect) and Agree calls reaccept-contract.
//
// This page never decides Current version / Acceptance validity / 3-day
// eligibility / requires_reacceptance itself -- every one of those is a
// server response value, rendered as-is.
//
// Legal / Contract Publication Refinement (2026-09): remark-gfm added so
// GFM tables in the pinned versions/*.md content (e.g. the plan pricing
// table) render as actual tables, matching the public /legal pages.
//
// Mobile RWD fix (2026-09): the rendered markdown is wrapped in
// .contract-review-content so App.css can target its <pre> blocks the
// same way it targets .legal-content's (see App.css) -- this page uses
// .auth-page, a different scope from the public /legal pages, but
// renders the same contract text and hits the same overflow bug.
//
// Payment Rebuild -- Step 6 (Oen One-time Checkout): once mode === 'initial'
// reaches 'agreed', this is the earliest point a new Order is actually
// allowed to exist (create-order-checkout's Contract Acceptance Gate), so
// the plan choice + checkout trigger lives here rather than on /pricing --
// /pricing still only routes a new visitor INTO this page (unchanged).
// 'reacceptance' mode deliberately does NOT get these buttons: a member
// routed here for reacceptance already has an active relationship with
// JOTI, and deciding whether/when they should be prompted to buy again is
// Step 8 (Membership/Entitlement) territory, not something to attach here.
const CHECKOUT_PLANS = [
  { code: 'monthly', label: '月方案 NT$333' },
  { code: 'annual', label: '年方案 NT$3,333' }
]

function ContractReviewPage() {
  const { loading, user } = useAuth()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') === 'reacceptance' ? 'reacceptance' : 'initial'

  const [state, setState] = useState('loading') // loading | ready | agreeing | agreed | error
  const [review, setReview] = useState(null) // { contractVersion, presentedAt, reviewAvailableAt, contentIdentifier }
  const [message, setMessage] = useState(null)
  // Separate from `state` above (which governs the Review/Agree flow) --
  // checkout only ever starts after state === 'agreed', and a checkout
  // failure should not reset the already-successful agreement state.
  const [checkoutPlanCode, setCheckoutPlanCode] = useState(null) // which plan button is in flight, or null
  const [checkoutError, setCheckoutError] = useState(null)
  // Derived from review.reviewAvailableAt, but Date.now() may only be
  // read inside an effect (not during render, per React's purity rule) --
  // recomputed on an interval so the button flips to enabled without
  // requiring a manual refresh once the 3 days pass while the tab is open.
  const [eligible, setEligible] = useState(mode === 'reacceptance')

  useEffect(() => {
    if (loading || !user) return

    let cancelled = false

    async function loadInitial() {
      const { data, error } = await supabase.functions.invoke('start-contract-review', {
        body: {}
      })
      if (cancelled) return

      if (error || data?.error) {
        setState('error')
        setMessage(data?.error || error?.message || '無法載入契約審閱資訊，請稍後再試。')
        return
      }

      setReview({
        contractVersion: data.contractVersion,
        presentedAt: data.presentedAt,
        reviewAvailableAt: data.reviewAvailableAt,
        contentIdentifier: data.contentIdentifier
      })
      setState('ready')
    }

    async function loadReacceptance() {
      // Public metadata read (RLS: contract_versions is select-open) --
      // no Edge Function needed for display, and deliberately does not
      // touch profiles.review_contract_version / review_presented_at.
      const { data, error } = await supabase
        .from('contract_versions')
        .select('version, content_identifier, requires_reacceptance')
        .eq('is_current', true)
        .maybeSingle()

      if (cancelled) return

      if (error || !data) {
        setState('error')
        setMessage(error?.message || '目前沒有需要重新同意的契約版本。')
        return
      }

      setReview({
        contractVersion: data.version,
        presentedAt: null,
        reviewAvailableAt: null,
        contentIdentifier: data.content_identifier
      })
      setState('ready')
    }

    if (mode === 'reacceptance') {
      loadReacceptance()
    } else {
      loadInitial()
    }

    return () => {
      cancelled = true
    }
  }, [loading, user, mode])

  useEffect(() => {
    if (mode === 'reacceptance' || !review?.reviewAvailableAt) return undefined

    const availableAtMs = new Date(review.reviewAvailableAt).getTime()

    function check() {
      setEligible(Date.now() >= availableAtMs)
    }

    check()
    const timer = setInterval(check, 30_000)
    return () => clearInterval(timer)
  }, [mode, review?.reviewAvailableAt])

  async function handleAgree() {
    setState('agreeing')
    setMessage(null)

    const functionName = mode === 'reacceptance' ? 'reaccept-contract' : 'agree-to-contract'
    const { data, error } = await supabase.functions.invoke(functionName, { body: {} })

    if (error || data?.error) {
      setState('ready')
      setMessage(
        data?.error === 'no_eligible_pending_review'
          ? '尚未滿最低審閱天數，或審閱狀態已變更，請重新整理頁面。'
          : data?.error || error?.message || '同意契約失敗，請稍後再試。'
      )
      return
    }

    setState('agreed')
  }

  async function handleCheckout(planCode) {
    setCheckoutPlanCode(planCode)
    setCheckoutError(null)

    const { data, error } = await supabase.functions.invoke('create-order-checkout', {
      body: { planCode }
    })

    if (error || data?.error || !data?.redirectUrl) {
      setCheckoutPlanCode(null)
      setCheckoutError(data?.error || error?.message || '無法建立訂單，請稍後再試。')
      return
    }

    // Full navigation (not react-router) -- the provider's hosted checkout
    // page is an external origin, not a route inside this SPA. Redirect
    // (Oen) or signed form POST (ECPay) -- see startProviderCheckout.
    startProviderCheckout(data)
  }

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const content = review ? getContractContent(review.contentIdentifier) : null

  return (
    <div className="auth-page">
      <h1>{mode === 'reacceptance' ? '契約條款更新，請重新確認同意' : '契約審閱'}</h1>

      {state === 'loading' && <p>載入中…</p>}
      {state === 'error' && <p>{message}</p>}

      {review && (
        <>
          {mode === 'initial' && (
            <p className="subtitle">
              契約提供時間：{new Date(review.presentedAt).toLocaleString('zh-TW')}
              <br />
              最早可同意時間：{new Date(review.reviewAvailableAt).toLocaleString('zh-TW')}
            </p>
          )}

          {content ? (
            <div className="contract-review-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <p>目前無法載入契約內容（版本：{review.contractVersion}）。</p>
          )}

          {state !== 'agreed' && (
            <button
              type="button"
              className="button"
              onClick={handleAgree}
              disabled={!eligible || state === 'agreeing'}
            >
              {state === 'agreeing' ? '處理中…' : '我已審閱並同意本契約'}
            </button>
          )}

          {state === 'agreed' && mode === 'initial' && (
            <div className="contract-review-checkout">
              <p>已完成同意，感謝您的審閱。選擇方案即可前往付款：</p>

              {checkoutError && <p>{checkoutError}</p>}

              <div className="pricing-cta">
                {CHECKOUT_PLANS.map((plan) => (
                  <button
                    key={plan.code}
                    type="button"
                    className="button"
                    onClick={() => handleCheckout(plan.code)}
                    disabled={checkoutPlanCode !== null}
                  >
                    {checkoutPlanCode === plan.code ? '前往付款頁…' : plan.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state === 'agreed' && mode === 'reacceptance' && <p>已完成同意，感謝您的審閱。</p>}
        </>
      )}
    </div>
  )
}

export default ContractReviewPage
