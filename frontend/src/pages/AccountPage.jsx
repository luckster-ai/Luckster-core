import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus, getTrialUsageSummary, MEMBERSHIP_STATUS } from '../utils/membershipStatus'
import { formatVideoDuration } from '../utils/formatDuration'
import { usePracticeHistory } from '../hooks/usePracticeHistory'
import PracticeHistory from '../components/PracticeHistory'

const STATUS_LABEL = {
  [MEMBERSHIP_STATUS.ADMIN]: 'Admin',
  [MEMBERSHIP_STATUS.TRIAL]: '免費體驗中',
  [MEMBERSHIP_STATUS.TRIAL_EXPIRED]: '免費體驗已結束'
}

// Membership / Authentication Foundation (Phase 2A). Trial usage/
// remaining-time display added Phase 4E -- a static snapshot of
// profile.module_usage_seconds / trial_started_at (see
// getTrialUsageSummary()'s own comment for why a static snapshot,
// not a live countdown, is the right amount of precision here).
function AccountPage() {
  const { loading, user, profile, signOut, setMarketingConsent } = useAuth()
  const { sessions, loading: historyLoading } = usePracticeHistory()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const status = getMembershipStatus(profile)
  const usageSummary =
    status === MEMBERSHIP_STATUS.TRIAL || status === MEMBERSHIP_STATUS.TRIAL_EXPIRED
      ? getTrialUsageSummary(profile)
      : null

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

      <PracticeHistory sessions={sessions} loading={historyLoading} />

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
