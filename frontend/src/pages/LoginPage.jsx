import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'

// Membership / Authentication Foundation (Phase 2A). Google + Email
// magic link only -- Facebook OAuth deliberately left out of this first
// phase (extra Meta Developer app setup/review overhead for a login
// method whose relative value here hasn't been demonstrated yet); can
// be added later the same way Google was, without touching this page's
// structure.
function LoginPage() {
  const { isConfigured, loading, user, sendMagicLink, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState(null)

  if (loading) return null
  if (user) return <Navigate to="/account" replace />

  if (!isConfigured) {
    return (
      <div className="auth-page">
        <h1>登入</h1>
        <p>會員登入功能尚未設定完成，請稍後再試。</p>
      </div>
    )
  }

  async function handleMagicLink(event) {
    event.preventDefault()
    setStatus('sending')

    const { error } = await sendMagicLink(email)

    setStatus(error ? 'error' : 'sent')
  }

  async function handleGoogle() {
    await signInWithGoogle()
  }

  return (
    <div className="auth-page">
      <h1>登入 / 註冊</h1>

      <p>使用 Google 或 Email 登入，第一次登入即自動建立會員帳號。</p>

      <button type="button" className="button" onClick={handleGoogle}>
        使用 Google 登入
      </button>

      <form className="auth-field" onSubmit={handleMagicLink}>
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <button type="submit" className="button secondary" disabled={status === 'sending'}>
          傳送登入連結
        </button>
      </form>

      {status === 'sent' && <p>登入連結已寄出，請至信箱點擊連結完成登入。</p>}
      {status === 'error' && <p>發送失敗，請稍後再試。</p>}
    </div>
  )
}

export default LoginPage
