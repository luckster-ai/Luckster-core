import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { supabase } from '../lib/supabaseClient'
import {
  getMembershipStatus,
  getTrialUsageSummary,
  getActivePaidServicePeriod,
  getUpcomingServicePeriod,
  MEMBERSHIP_STATUS
} from '../utils/membershipStatus'
import { formatVideoDuration } from '../utils/formatDuration'
import { canOfferPurchase, getContractAcceptanceState } from '../utils/purchaseEligibility'
import PlanPurchase from '../components/PlanPurchase'
import { classifyTerminationResult, readTerminationBody } from '../utils/terminationResult'
import { usePracticeHistory } from '../hooks/usePracticeHistory'
import PracticeHistory from '../components/PracticeHistory'

const STATUS_LABEL = {
  [MEMBERSHIP_STATUS.ADMIN]: 'Admin',
  [MEMBERSHIP_STATUS.SUBSCRIBER]: '付費會員',
  [MEMBERSHIP_STATUS.TRIAL]: '免費體驗中',
  [MEMBERSHIP_STATUS.TRIAL_EXPIRED]: '免費體驗已結束'
}

// Payment Rebuild -- Step 8: display-only label, not used for any pricing
// or entitlement decision -- those already live elsewhere (data/pricing.js,
// the entitlement check in utils/membershipStatus.js).
const PLAN_LABEL = {
  monthly: '月方案',
  annual: '年方案'
}

// Payment Phase 1 -- Oen TEST first-subscription MVP. The subscribe entry
// point (Link + the ?checkout return handling) is only meaningful on the
// Preview deployment where /subscribe exists (VITE_ENABLE_SUBSCRIBE). On
// every other environment SUBSCRIBE_ENABLED is false and none of this
// renders, so AccountPage is unchanged for current users.
const SUBSCRIBE_ENABLED = import.meta.env.VITE_ENABLE_SUBSCRIBE === 'true'
// Step 11 (Production Purchase Entry): the renewal 購買方案 block is shown
// only when VITE_ENABLE_PURCHASE === 'true' (see AppRouter). Early
// termination below is not gated.
const PURCHASE_ENABLED = import.meta.env.VITE_ENABLE_PURCHASE === 'true'
const MAX_ACTIVATION_POLLS = 10

// Membership / Authentication Foundation (Phase 2A). Trial usage/
// remaining-time display added Phase 4E -- a static snapshot of
// profile.module_usage_seconds / trial_started_at (see
// getTrialUsageSummary()'s own comment for why a static snapshot,
// not a live countdown, is the right amount of precision here).
function AccountPage() {
  const { loading, user, profile, signOut, setMarketingConsent, refreshProfile } = useAuth()
  const { sessions, officialById, loading: historyLoading } = usePracticeHistory()

  const [searchParams] = useSearchParams()
  const checkoutResult = SUBSCRIBE_ENABLED ? searchParams.get('checkout') : null

  const status = getMembershipStatus(profile)
  const activePeriod = getActivePaidServicePeriod(profile)
  const upcomingPeriod = getUpcomingServicePeriod(profile)
  const activating =
    checkoutResult === 'success' && status !== MEMBERSHIP_STATUS.SUBSCRIBER

  // Payment Rebuild -- Step 10 added After-Expiry purchase and Immediate
  // Change (Monthly -> Annual) here; both were removed with the ECPay
  // Checkout Session flow (no Advance Purchase / After-Expiry / Plan
  // Change). Only the generic early termination below remains.
  // `planChangeBusy` keeps its name (and its 'terminate' value) from Step 10.
  const [planChangeBusy, setPlanChangeBusy] = useState(null)
  const [planChangeError, setPlanChangeError] = useState(null)
  const [planChangeMessage, setPlanChangeMessage] = useState(null)

  // Step 11.1 -- Renewal Purchase Entry: a member who already accepted the
  // contract and has no current / future-dated Service Period buys again
  // here, without a new 3-day review (契約第九條第五項). PlanPurchase also
  // shows "付款進行中" while an ECPay checkout session is open.
  // undefined = not loaded yet, null = could not be read.
  const [contractAccepted, setContractAccepted] = useState(undefined)
  useEffect(() => {
    if (loading || !user) return undefined

    let cancelled = false
    getContractAcceptanceState().then((accepted) => {
      if (!cancelled) setContractAccepted(accepted)
    })
    return () => {
      cancelled = true
    }
  }, [loading, user])

  // Generic 第十一條 early termination -- for a member who wants to stop and
  // be refunded. Reuses Step 9's terminate-service-period unchanged.
  //
  // Step 11.2 -- Refund Failure UI: the termination itself can succeed even
  // when the provider refund then fails (502 { status: 'refund_failed' }),
  // so the result is classified from the response body (read from
  // error.context on a non-2xx) rather than treating every non-2xx as
  // "nothing happened". Terminated / unknown outcomes reload the profile so
  // the page shows the real plan state; definite failures do not.
  async function handleEarlyTermination() {
    if (!activePeriod) return
    setPlanChangeBusy('terminate')
    setPlanChangeError(null)
    setPlanChangeMessage(null)

    const { data, error } = await supabase.functions.invoke('terminate-service-period', {
      body: { servicePeriodId: activePeriod.id }
    })

    const body = await readTerminationBody(data, error)
    const result = classifyTerminationResult(body)

    setPlanChangeBusy(null)
    if (result.kind === 'refunded' || result.kind === 'refund_pending') {
      setPlanChangeMessage(result.message)
    } else {
      setPlanChangeError(result.message)
    }
    if (result.refresh) await refreshProfile()
  }

  // refreshProfile is a fresh function identity every AuthProvider render
  // (not memoized) -- keep it in a ref so the polling effect below doesn't
  // re-run purely on identity churn (same pattern as
  // hooks/useModuleUsageTracking.js).
  const refreshProfileRef = useRef(refreshProfile)
  useEffect(() => {
    refreshProfileRef.current = refreshProfile
  }, [refreshProfile])

  // Poll the profile a few times after returning from a successful checkout,
  // giving the Oen webhook time to activate the membership. setTimeout (not
  // an interval), re-armed when `status` changes (i.e. after each refresh),
  // so there is never more than one pending timer.
  const pollTries = useRef(0)
  useEffect(() => {
    if (!activating) return undefined
    if (pollTries.current >= MAX_ACTIVATION_POLLS) return undefined
    const timer = setTimeout(() => {
      pollTries.current += 1
      refreshProfileRef.current()
    }, 2000)
    return () => clearTimeout(timer)
  }, [activating, status])

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const usageSummary =
    status === MEMBERSHIP_STATUS.TRIAL || status === MEMBERSHIP_STATUS.TRIAL_EXPIRED
      ? getTrialUsageSummary(profile)
      : null

  const offerPurchase = canOfferPurchase(profile)

  const showSubscribeCta =
    SUBSCRIBE_ENABLED &&
    (status === MEMBERSHIP_STATUS.TRIAL || status === MEMBERSHIP_STATUS.TRIAL_EXPIRED)

  return (
    <div className="auth-page">
      <h1>我的帳號</h1>

      <p>
        <strong>Email：</strong>
        {user.email}
      </p>

      {status && (
        <p>
          <strong>會員狀態：</strong>
          {STATUS_LABEL[status]}
        </p>
      )}

      {activePeriod && (
        <>
          <p>
            <strong>目前方案：</strong>
            {PLAN_LABEL[activePeriod.plan_code] ?? activePeriod.plan_code}
          </p>
          <p>
            <strong>服務期間到期日：</strong>
            {new Date(activePeriod.service_period_end).toLocaleDateString('zh-TW')}
          </p>
        </>
      )}

      {upcomingPeriod && (
        <p>
          <strong>下一個方案：</strong>
          {PLAN_LABEL[upcomingPeriod.plan_code] ?? upcomingPeriod.plan_code}，將於
          {new Date(upcomingPeriod.service_period_start).toLocaleDateString('zh-TW')} 開始
        </p>
      )}

      {/* Outside the "目前方案" block below on purpose: after a successful
          termination refreshProfile() removes the active period, and with
          it that block -- the result message must stay visible. */}
      {planChangeError && <p className="plan-change-error">{planChangeError}</p>}
      {planChangeMessage && <p>{planChangeMessage}</p>}

      {PURCHASE_ENABLED && offerPurchase && contractAccepted === true && (
        <div className="plan-change-section">
          <h2>購買方案</h2>
          <p>你已完成契約同意，可直接購買，不需要重新審閱契約。</p>
          <PlanPurchase />
        </div>
      )}

      {PURCHASE_ENABLED && offerPurchase && contractAccepted === null && (
        <p>目前無法確認契約同意狀態，請稍後重新整理頁面。</p>
      )}

      {/* Early termination (第十一條). Hidden once a next plan is already
          scheduled (upcomingPeriod, historic Step 10 data only). */}
      {activePeriod && !upcomingPeriod && (
        <div className="plan-change-section">
          <h2>目前方案</h2>

          <button
            type="button"
            className="button secondary"
            disabled={Boolean(planChangeBusy)}
            onClick={handleEarlyTermination}
          >
            {planChangeBusy === 'terminate' ? '處理中…' : '提前終止目前方案並退款'}
          </button>
        </div>
      )}

      {checkoutResult === 'success' && (
        <p>
          {activating
            ? '付款完成，正在開通會員權限…'
            : status === MEMBERSHIP_STATUS.SUBSCRIBER
              ? '付費會員已開通 🎉'
              : '付款已完成。若狀態尚未更新，請稍後重新整理。'}
        </p>
      )}

      {checkoutResult === 'failed' && <p>付款未完成。</p>}

      {showSubscribeCta && (
        <p>
          <Link to="/subscribe">訂閱 JOTI</Link>
        </p>
      )}

      {usageSummary && (
        <>
          {/* Trial ends at 30 days OR 30 hours of Bunny usage, whichever
              first -- these two numbers are shown side by side, neither
              labeled as "the reason," since either one alone could be
              what actually ended it and this page has no way to know
              which. */}
          <p>
            <strong>Bunny Module 使用時間：</strong>
            {formatVideoDuration(usageSummary.usedSeconds)} / {formatVideoDuration(usageSummary.totalSeconds)}
          </p>

          <p>
            <strong>Trial 30 天期限：</strong>
            {usageSummary.trialEndsAt.toLocaleDateString('zh-TW')}
          </p>
        </>
      )}

      <PracticeHistory sessions={sessions} officialById={officialById} loading={historyLoading} />

      <label className="auth-consent">
        <input
          type="checkbox"
          checked={Boolean(profile?.marketing_consent)}
          onChange={(event) => setMarketingConsent(event.target.checked)}
        />
        我願意收到 JOTI 的課程與活動通知
      </label>

      <button type="button" className="button secondary" onClick={signOut}>
        登出
      </button>
    </div>
  )
}

export default AccountPage
