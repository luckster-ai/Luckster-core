import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus, MEMBERSHIP_STATUS } from '../utils/membershipStatus'

const STATUS_LABEL = {
  [MEMBERSHIP_STATUS.ADMIN]: 'Admin',
  [MEMBERSHIP_STATUS.TRIAL]: '免費體驗中',
  [MEMBERSHIP_STATUS.TRIAL_EXPIRED]: '免費體驗已結束'
}

// Membership / Authentication Foundation (Phase 2A). Minimal on purpose
// -- just enough to prove login/profile/consent actually work end to
// end. No trial countdown UI, no usage-time display, no upgrade CTA:
// none of that is wired to anything real yet (see membershipStatus.js),
// so showing it here would be decoration, not information.
function AccountPage() {
  const { loading, user, profile, signOut, setMarketingConsent } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const status = getMembershipStatus(profile)

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
