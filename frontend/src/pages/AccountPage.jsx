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
import { startProviderCheckout } from '../utils/startProviderCheckout'
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

  // Payment Rebuild -- Step 10: Plan Change entry point. `planChangeBusy`
  // names which specific action is in flight (not a bare boolean) so the
  // right button -- and only that one -- shows "處理中…"; every button is
  // still disabled while any one of them is busy, same as
  // ContractReviewPage's checkoutPlanCode pattern.
  const [planChangeBusy, setPlanChangeBusy] = useState(null)
  const [planChangeError, setPlanChangeError] = useState(null)
  const [planChangeMessage, setPlanChangeMessage] = useState(null)

  // After-Expiry purchase of either plan while a Service Period is still
  // active -- create-order-checkout's own Plan Change eligibility gate
  // (Step 10) computes and stores the actual scheduled start server-side;
  // this call never claims a date itself. Valid for every current-plan /
  // new-plan combination (Monthly->Monthly, Monthly->Annual,
  // Annual->Annual, Annual->Monthly) per the confirmed rules.
  async function handleAfterExpiryPurchase(planCode) {
    setPlanChangeBusy(`afterExpiry:${planCode}`)
    setPlanChangeError(null)
    setPlanChangeMessage(null)

    const { data, error } = await supabase.functions.invoke('create-order-checkout', {
      body: { planCode, afterExpiry: true }
    })

    if (error || data?.error || !data?.redirectUrl) {
      setPlanChangeBusy(null)
      setPlanChangeError(data?.error || error?.message || '無法建立訂單，請稍後再試。')
      return
    }

    startProviderCheckout(data)
  }

  // Immediate Change -- Monthly -> Annual only, per the confirmed rules.
  // create-plan-change-checkout (Step 10) terminates the current Monthly
  // period (refund per 第十一條) and only then starts the new Annual
  // purchase -- this page does not orchestrate those two steps itself.
  async function handleImmediateUpgradeToAnnual() {
    setPlanChangeBusy('immediate:annual')
    setPlanChangeError(null)
    setPlanChangeMessage(null)

    const { data, error } = await supabase.functions.invoke('create-plan-change-checkout', {
      body: { newPlanCode: 'annual' }
    })

    if (error || data?.error || !data?.redirectUrl) {
      setPlanChangeBusy(null)
      setPlanChangeError(data?.error || error?.message || '無法建立訂單，請稍後再試。')
      return
    }

    startProviderCheckout(data)
  }

  // Generic 第十一條 early termination -- the only UI path for Annual's
  // "Immediate" switch to Monthly (confirmed rule: walk the generic
  // termination + refund flow, then purchase Monthly separately below),
  // and also usable on its own for a member who just wants to stop and be
  // refunded. Reuses Step 9's terminate-service-period unchanged.
  async function handleEarlyTermination() {
    if (!activePeriod) return
    setPlanChangeBusy('terminate')
    setPlanChangeError(null)
    setPlanChangeMessage(null)

    const { data, error } = await supabase.functions.invoke('terminate-service-period', {
      body: { servicePeriodId: activePeriod.id }
    })

    setPlanChangeBusy(null)
    if (error || data?.error) {
      setPlanChangeError(data?.error || error?.message || '提前終止失敗，請稍後再試。')
      return
    }

    setPlanChangeMessage('已提前終止目前方案，退款將依契約第十一條辦理。')
    await refreshProfile()
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

      {/* Payment Rebuild -- Step 10: Plan Change entry point. Hidden once a
          next plan is already scheduled (upcomingPeriod) -- choosing
          another change on top of an already-pending one is not a
          confirmed scenario, so this round does not offer it. */}
      {activePeriod && !upcomingPeriod && (
        <div className="plan-change-section">
          <h2>方案變更</h2>
          <p className="plan-change-note">
            「立即升級」會提前結束目前方案並依契約第十一條計算退款，新方案立即開始；「到期後開始」不影響目前方案，新方案於目前方案到期後才開始，且不辦理退款。
          </p>

          {planChangeError && <p className="plan-change-error">{planChangeError}</p>}
          {planChangeMessage && <p>{planChangeMessage}</p>}

          {activePeriod.plan_code === 'monthly' && (
            <div className="plan-change-actions">
              <button
                type="button"
                className="button"
                disabled={Boolean(planChangeBusy)}
                onClick={() => handleAfterExpiryPurchase('monthly')}
              >
                {planChangeBusy === 'afterExpiry:monthly' ? '處理中…' : '續購月方案（到期後開始）'}
              </button>
              <button
                type="button"
                className="button"
                disabled={Boolean(planChangeBusy)}
                onClick={handleImmediateUpgradeToAnnual}
              >
                {planChangeBusy === 'immediate:annual' ? '處理中…' : '立即升級為年方案'}
              </button>
              <button
                type="button"
                className="button"
                disabled={Boolean(planChangeBusy)}
                onClick={() => handleAfterExpiryPurchase('annual')}
              >
                {planChangeBusy === 'afterExpiry:annual' ? '處理中…' : '年方案（到期後開始）'}
              </button>
            </div>
          )}

          {activePeriod.plan_code === 'annual' && (
            <div className="plan-change-actions">
              <button
                type="button"
                className="button"
                disabled={Boolean(planChangeBusy)}
                onClick={() => handleAfterExpiryPurchase('annual')}
              >
                {planChangeBusy === 'afterExpiry:annual' ? '處理中…' : '續購年方案（到期後開始）'}
              </button>
              <button
                type="button"
                className="button"
                disabled={Boolean(planChangeBusy)}
                onClick={() => handleAfterExpiryPurchase('monthly')}
              >
                {planChangeBusy === 'afterExpiry:monthly' ? '處理中…' : '月方案（到期後開始）'}
              </button>
            </div>
          )}

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
