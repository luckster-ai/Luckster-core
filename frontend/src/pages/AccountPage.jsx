import { useEffect, useRef } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus, getTrialUsageSummary, MEMBERSHIP_STATUS } from '../utils/membershipStatus'
import { formatVideoDuration } from '../utils/formatDuration'
import { usePracticeHistory } from '../hooks/usePracticeHistory'
import PracticeHistory from '../components/PracticeHistory'

const STATUS_LABEL = {
  [MEMBERSHIP_STATUS.ADMIN]: 'Admin',
  [MEMBERSHIP_STATUS.SUBSCRIBER]: '付費會員',
  [MEMBERSHIP_STATUS.TRIAL]: '免費體驗中',
  [MEMBERSHIP_STATUS.TRIAL_EXPIRED]: '免費體驗已結束'
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
  const activating =
    checkoutResult === 'success' && status !== MEMBERSHIP_STATUS.SUBSCRIBER

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
