import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import {
  getAuthErrorMessage,
  isEmailNotConfirmed,
  MIN_PASSWORD_LENGTH,
  validateNewPassword
} from '../utils/authErrors'

// Membership / Authentication. Google + Email + Password -- the Phase 2A
// email magic link was removed in favor of passwords. Facebook OAuth is
// still deliberately left out (extra Meta Developer app setup/review
// overhead for a login method whose relative value here hasn't been
// demonstrated yet); it can be added later the same way Google was.
//
// One page, three modes (?mode=signup / ?mode=forgot, default sign in)
// so other pages can link straight to a mode, e.g. ResetPasswordPage's
// "request a new link".
const MODES = {
  signin: { title: '登入', submit: '登入' },
  signup: { title: '註冊會員', submit: '註冊' },
  forgot: { title: '忘記密碼', submit: '寄送重設密碼信' }
}

function LoginPage() {
  const {
    isConfigured,
    loading,
    user,
    signInWithGoogle,
    signInWithPassword,
    signUpWithPassword,
    resendSignupConfirmation,
    sendPasswordResetEmail
  } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = MODES[searchParams.get('mode')] ? searchParams.get('mode') : 'signin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // idle | submitting | signedUp | resetSent | resent
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState(null)
  const [canResendConfirmation, setCanResendConfirmation] = useState(false)

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

  function switchMode(nextMode) {
    setSearchParams(nextMode === 'signin' ? {} : { mode: nextMode }, { replace: true })
    setPassword('')
    setConfirmPassword('')
    setStatus('idle')
    setErrorMessage(null)
    setCanResendConfirmation(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage(null)
    setCanResendConfirmation(false)

    if (mode === 'signup') {
      const invalid = validateNewPassword(password, confirmPassword)
      if (invalid) {
        setErrorMessage(invalid)
        return
      }
    }

    setStatus('submitting')

    if (mode === 'signin') {
      // On success onAuthStateChange sets the user and the <Navigate>
      // above takes the member to /account.
      const { error } = await signInWithPassword(email, password)
      setStatus('idle')
      if (error) {
        setErrorMessage(getAuthErrorMessage(error))
        setCanResendConfirmation(isEmailNotConfirmed(error))
      }
      return
    }

    if (mode === 'signup') {
      const { error } = await signUpWithPassword(email, password)
      if (error) {
        setStatus('idle')
        setErrorMessage(getAuthErrorMessage(error))
        return
      }
      // No session yet (email confirmation required). Supabase reports
      // success even for an already-registered email (no account
      // enumeration), so the message covers that case too.
      setStatus('signedUp')
      setPassword('')
      setConfirmPassword('')
      return
    }

    const { error } = await sendPasswordResetEmail(email)
    if (error) {
      setStatus('idle')
      setErrorMessage(getAuthErrorMessage(error))
      return
    }
    setStatus('resetSent')
  }

  async function handleResendConfirmation() {
    setErrorMessage(null)
    setStatus('submitting')

    const { error } = await resendSignupConfirmation(email)

    if (error) {
      setStatus('idle')
      setErrorMessage(getAuthErrorMessage(error))
      return
    }
    setCanResendConfirmation(false)
    setStatus('resent')
  }

  async function handleGoogle() {
    await signInWithGoogle()
  }

  const submitting = status === 'submitting'

  if (status === 'signedUp' || status === 'resent') {
    return (
      <div className="auth-page">
        <h1>請到信箱完成驗證</h1>
        <p>
          驗證信已寄到 {email}。請點擊信中的連結完成 Email 驗證，之後即可使用 Email 與密碼登入。
        </p>
        <p>
          如果沒有收到，請檢查垃圾郵件匣。如果這個 Email 先前已經註冊，請直接登入，或使用「忘記密碼」重設密碼。
        </p>
        {status === 'signedUp' && (
          <button type="button" className="button secondary" onClick={handleResendConfirmation}>
            重新寄送驗證信
          </button>
        )}
        {errorMessage && <p>{errorMessage}</p>}
        <p>
          <button type="button" className="link-button" onClick={() => switchMode('signin')}>
            返回登入
          </button>
        </p>
      </div>
    )
  }

  if (status === 'resetSent') {
    return (
      <div className="auth-page">
        <h1>請到信箱重設密碼</h1>
        <p>如果 {email} 已註冊 JOTI 會員，重設密碼信已寄出。請點擊信中的連結設定新密碼。</p>
        <p>如果沒有收到，請檢查垃圾郵件匣，或稍候幾分鐘再試一次。</p>
        <p>
          <button type="button" className="link-button" onClick={() => switchMode('signin')}>
            返回登入
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <h1>{MODES[mode].title}</h1>

      {mode === 'forgot' ? (
        <p>輸入註冊時使用的 Email，我們會寄送重設密碼的連結給你。</p>
      ) : (
        <>
          <p>
            {mode === 'signup'
              ? '使用 Google 或 Email 建立 JOTI 會員帳號。'
              : '使用 Google 或 Email 與密碼登入 JOTI。'}
          </p>

          <button type="button" className="button" onClick={handleGoogle}>
            使用 Google {mode === 'signup' ? '註冊' : '登入'}
          </button>
        </>
      )}

      <form className="auth-field" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        {mode !== 'forgot' && (
          <label>
            密碼
            <input
              type="password"
              required
              minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === 'signup' ? `至少 ${MIN_PASSWORD_LENGTH} 個字元` : undefined}
            />
          </label>
        )}

        {mode === 'signup' && (
          <label>
            確認密碼
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        )}

        <button type="submit" className="button secondary" disabled={submitting}>
          {submitting ? '處理中...' : MODES[mode].submit}
        </button>
      </form>

      {errorMessage && <p>{errorMessage}</p>}
      {canResendConfirmation && (
        <button type="button" className="button secondary" onClick={handleResendConfirmation}>
          重新寄送驗證信
        </button>
      )}

      {mode === 'signin' && (
        <>
          <p>
            <button type="button" className="link-button" onClick={() => switchMode('forgot')}>
              忘記密碼？
            </button>
          </p>
          <p>
            還沒有帳號？{' '}
            <button type="button" className="link-button" onClick={() => switchMode('signup')}>
              註冊會員
            </button>
          </p>
        </>
      )}
      {mode === 'signup' && (
        <p>
          已經有帳號？{' '}
          <button type="button" className="link-button" onClick={() => switchMode('signin')}>
            登入
          </button>
        </p>
      )}
      {mode === 'forgot' && (
        <p>
          <button type="button" className="link-button" onClick={() => switchMode('signin')}>
            返回登入
          </button>
        </p>
      )}
    </div>
  )
}

export default LoginPage
