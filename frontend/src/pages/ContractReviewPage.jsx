import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import LegalMarkdown from '../components/LegalMarkdown'
import { useAuth } from '../state/useAuth'
import { supabase } from '../lib/supabaseClient'
import { getContractContent } from '../utils/contractContent'
import { canOfferPurchase, getContractAcceptanceState } from '../utils/purchaseEligibility'
import PlanPurchase from '../components/PlanPurchase'
import { readTerminationBody } from '../utils/terminationResult'

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
// Legal / Contract Publication Refinement (2026-09): the pinned
// versions/*.md content renders through components/LegalMarkdown.jsx
// (GFM tables, numbered-clause hanging indent), same as the public /legal
// pages.
//
// Mobile RWD fix (2026-09): the rendered markdown is wrapped in
// .contract-review-content so App.css can target its <pre> blocks the
// same way it targets .legal-content's (see App.css) -- this page has its
// own container, a different scope from the public /legal pages, but
// renders the same contract text and hits the same overflow bug.
//
// Step 11 (Contract Review UI / RWD Refinement): the page uses its own
// .contract-review-page container (a ~760px reading layout like
// .legal-page) instead of the 480px, centered .auth-page card used by
// Login / Account. While the 3-day review is still running, a per-second
// countdown to reviewAvailableAt is shown and the agree button has an
// explicit disabled look; it enables itself when the time is reached. The
// countdown is UX only -- agree_to_contract() still enforces the 3 days
// server-side (409 no_eligible_pending_review). reacceptance mode has no
// reviewAvailableAt and is unaffected.
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
//
// Step 11.1 (Renewal Purchase Entry): the plan buttons now live in the
// shared components/PlanPurchase.jsx (same checkout flow, also used by
// AccountPage). In 'initial' mode a member who ALREADY has a Contract
// Acceptance is not put through start-contract-review again (that would
// pin a fresh 3-day review, contrary to 契約第九條第五項 -- renewal does not
// restart the review): the page shows 'accepted' and offers the plans
// directly, unless the member currently has (or is scheduled to have) a
// plan, or is an admin.

// "2 天 3 小時 4 分 5 秒" -- days omitted once under a day.
function formatRemaining(ms) {
  const totalSeconds = Math.ceil(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const time = `${hours} 小時 ${minutes} 分 ${seconds} 秒`
  return days > 0 ? `${days} 天 ${time}` : time
}

// Contract Review error codes (start-contract-review / agree-to-contract /
// reaccept-contract) as member-facing text. On a non-2xx supabase-js
// returns data = null and the response on error.context, so the code is
// read with readTerminationBody() (same as PlanPurchase); anything
// unrecognised falls back to a generic message, never the raw English
// error text.
const CONTRACT_ERROR_TEXT = {
  no_eligible_pending_review: '尚未滿最低審閱天數，或審閱狀態已變更，請重新整理頁面。',
  no_reacceptance_required: '目前沒有需要重新同意的契約版本。',
  already_accepted: '你已同意目前版本的契約，不需要再次同意。',
  no_current_contract_version: '目前無法提供契約審閱，請稍後再試。',
  unauthorized: '登入狀態已失效，請重新登入後再試。'
}

function ContractReviewPage() {
  const { loading, user, profile } = useAuth()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') === 'reacceptance' ? 'reacceptance' : 'initial'

  const [state, setState] = useState('loading') // loading | accepted | ready | agreeing | agreed | error
  const [review, setReview] = useState(null) // { contractVersion, presentedAt, reviewAvailableAt, contentIdentifier }
  const [message, setMessage] = useState(null)
  // Derived from review.reviewAvailableAt, but Date.now() may only be
  // read inside an effect (not during render, per React's purity rule) --
  // recomputed on an interval so the button flips to enabled without
  // requiring a manual refresh once the 3 days pass while the tab is open.
  const [eligible, setEligible] = useState(mode === 'reacceptance')
  // Milliseconds left until reviewAvailableAt (initial mode only), or null.
  const [remainingMs, setRemainingMs] = useState(null)

  useEffect(() => {
    if (loading || !user) return

    let cancelled = false

    async function loadInitial() {
      // Renewal (Step 11.1): an already-accepted member skips the review.
      // An unreadable acceptance state is an error, never "not accepted".
      const accepted = await getContractAcceptanceState()
      if (cancelled) return
      if (accepted === null) {
        setState('error')
        setMessage('無法確認契約同意狀態，請稍後重新整理頁面。')
        return
      }
      if (accepted) {
        setState('accepted')
        return
      }

      const { data, error } = await supabase.functions.invoke('start-contract-review', {
        body: {}
      })
      const body = await readTerminationBody(data, error)
      if (cancelled) return

      if (error || body?.error) {
        setState('error')
        setMessage(CONTRACT_ERROR_TEXT[body?.error] || '無法載入契約審閱資訊，請稍後再試。')
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
        setMessage(error ? '無法載入契約資訊，請稍後再試。' : '目前沒有需要重新同意的契約版本。')
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
    let timer = null

    function check() {
      const remaining = availableAtMs - Date.now()
      setRemainingMs(Math.max(remaining, 0))
      setEligible(remaining <= 0)
      if (remaining <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }

    check()
    if (Date.now() < availableAtMs) timer = setInterval(check, 1000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [mode, review?.reviewAvailableAt])

  async function handleAgree() {
    setState('agreeing')
    setMessage(null)

    const functionName = mode === 'reacceptance' ? 'reaccept-contract' : 'agree-to-contract'
    const { data, error } = await supabase.functions.invoke(functionName, { body: {} })
    const body = await readTerminationBody(data, error)

    if (error || body?.error) {
      setState('ready')
      setMessage(CONTRACT_ERROR_TEXT[body?.error] || '同意契約失敗，請稍後再試。')
      return
    }

    setState('agreed')
  }

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const content = review ? getContractContent(review.contentIdentifier) : null

  return (
    <div className="contract-review-page">
      <h1>
        {mode === 'reacceptance'
          ? '契約條款更新，請重新確認同意'
          : state === 'accepted'
            ? '購買方案'
            : '契約審閱'}
      </h1>

      {state === 'loading' && <p>載入中…</p>}
      {state === 'error' && <p>{message}</p>}

      {state === 'accepted' && (
        <div className="contract-review-checkout">
          <p>
            你已完成契約同意，續購不需要重新審閱契約（
            <Link to="/legal/terms">查看會員服務契約</Link>）。
          </p>
          {canOfferPurchase(profile) ? (
            <>
              <p>選擇方案即可前往付款：</p>
              <PlanPurchase />
            </>
          ) : (
            <p>
              你目前已有有效的方案，或此帳號不提供購買。<Link to="/account">前往我的帳號</Link>
            </p>
          )}
        </div>
      )}

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
              <LegalMarkdown>{content}</LegalMarkdown>
            </div>
          ) : (
            <p>目前無法載入契約內容（版本：{review.contractVersion}）。</p>
          )}

          {mode === 'initial' && state === 'ready' && !eligible && remainingMs !== null && (
            <p className="contract-review-countdown">
              審閱期間尚未結束，距離可同意還有 {formatRemaining(remainingMs)}
            </p>
          )}

          {state !== 'agreed' && (
            <button
              type="button"
              className="button contract-review-agree"
              onClick={handleAgree}
              disabled={!eligible || state === 'agreeing'}
            >
              {state === 'agreeing' ? '處理中…' : '我已審閱並同意本契約'}
            </button>
          )}

          {/* Agree failure: handleAgree returns to 'ready' with a message --
              shown here, next to the button (the top-level message only
              renders in the 'error' state). */}
          {state === 'ready' && message && <p>{message}</p>}

          {state === 'agreed' && mode === 'initial' && (
            <div className="contract-review-checkout">
              <p>已完成同意，感謝您的審閱。選擇方案即可前往付款：</p>
              <PlanPurchase />
            </div>
          )}

          {state === 'agreed' && mode === 'reacceptance' && <p>已完成同意，感謝您的審閱。</p>}
        </>
      )}
    </div>
  )
}

export default ContractReviewPage
