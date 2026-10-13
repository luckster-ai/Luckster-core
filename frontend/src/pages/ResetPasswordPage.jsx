import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import {
  getAuthErrorMessage,
  getAuthRedirectErrorMessage,
  MIN_PASSWORD_LENGTH,
  validateNewPassword
} from '../utils/authErrors'

// Landing page of the reset password email (see AuthProvider's
// sendPasswordResetEmail). supabase-js turns the link's recovery token
// into a signed-in session before this renders, so "has a session" is
// what allows setting a new password here. A failed link (expired,
// already used) arrives with no session and an error in the URL.
function ResetPasswordPage() {
  const { isConfigured, loading, user, updatePassword } = useAuth()
  const navigate = useNavigate()
  // Read once on first render: the URL error params are only meaningful
  // for the visit that arrived from the email link.
  const [linkError] = useState(() => getAuthRedirectErrorMessage(window.location))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState(null)

  if (loading) return null

  if (!isConfigured) {
    return (
      <div className="auth-page">
        <h1>設定新密碼</h1>
        <p>會員登入功能尚未設定完成，請稍後再試。</p>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="auth-page">
        <h1>密碼已更新</h1>
        <p>你的新密碼已設定完成，之後請使用新密碼登入。</p>
        <button type="button" className="button" onClick={() => navigate('/account', { replace: true })}>
          前往我的帳號
        </button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="auth-page">
        <h1>設定新密碼</h1>
        <p>{linkError || '重設密碼連結已失效，請重新申請重設密碼信。'}</p>
        <Link className="button" to="/login?mode=forgot">
          重新申請重設密碼信
        </Link>
      </div>
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage(null)

    const invalid = validateNewPassword(password, confirmPassword)
    if (invalid) {
      setErrorMessage(invalid)
      return
    }

    setStatus('submitting')
    const { error } = await updatePassword(password)

    if (error) {
      setStatus('idle')
      setErrorMessage(getAuthErrorMessage(error))
      return
    }
    setStatus('done')
  }

  return (
    <div className="auth-page">
      <h1>設定新密碼</h1>
      <p>請為 {user.email} 設定新的登入密碼。</p>

      <form className="auth-field" onSubmit={handleSubmit}>
        <label>
          新密碼
          <input
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={`至少 ${MIN_PASSWORD_LENGTH} 個字元`}
          />
        </label>

        <label>
          確認新密碼
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>

        <button type="submit" className="button secondary" disabled={status === 'submitting'}>
          {status === 'submitting' ? '處理中...' : '更新密碼'}
        </button>
      </form>

      {errorMessage && <p>{errorMessage}</p>}
    </div>
  )
}

export default ResetPasswordPage
