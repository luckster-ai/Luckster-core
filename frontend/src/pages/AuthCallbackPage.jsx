import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getAuthRedirectErrorMessage } from '../utils/authErrors'

// Membership / Authentication. Supabase's client parses the redirect URL
// and establishes the session automatically (detectSessionInUrl
// defaults to true) -- this page just waits for that to resolve, then
// routes onward. Both Google OAuth and the sign-up verification email
// redirect here (see AuthProvider's AUTH_CALLBACK_PATH). The reset
// password email goes to ResetPasswordPage instead.
//
// A failed email link (expired / already used) comes back with error
// params in the URL and no session -- shown here rather than silently
// bouncing to /login.
function AuthCallbackPage() {
  const { loading, user, isPasswordRecovery } = useAuth()
  const navigate = useNavigate()
  const [linkError] = useState(() => getAuthRedirectErrorMessage(window.location))

  useEffect(() => {
    // AuthProvider routes a recovery session to the reset page itself.
    if (loading || isPasswordRecovery) return
    if (user) {
      navigate('/account', { replace: true })
    } else if (!linkError) {
      navigate('/login', { replace: true })
    }
  }, [loading, user, isPasswordRecovery, linkError, navigate])

  if (!loading && !user && linkError) {
    return (
      <div className="auth-page">
        <h1>無法完成驗證</h1>
        <p>{linkError}</p>
        <p>如果是註冊驗證信，請回到登入頁輸入 Email 與密碼，系統會提示你重新寄送驗證信。</p>
        <Link className="button" to="/login">
          前往登入
        </Link>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <p>登入中，請稍候...</p>
    </div>
  )
}

export default AuthCallbackPage
