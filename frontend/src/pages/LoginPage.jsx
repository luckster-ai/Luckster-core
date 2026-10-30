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

// Google's "G" mark, inline (no external image), for the Google button.
function GoogleIcon() {
  return (
    <svg className="login-google-icon" viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}

// Eye / eye-off icons for the password field's show/hide toggle.
function EyeIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 4l16 16" />}
    </svg>
  )
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
  // Show/hide for the password field(s); input type only, values unchanged.
  const [showPassword, setShowPassword] = useState(false)

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
    <div className="auth-page login-page">
      <h1>{MODES[mode].title}</h1>

      {/* No intro line for 登入 / 註冊: the Google button and the Email
          form already say how. */}
      {mode === 'forgot' ? (
        <p className="login-intro">輸入註冊時使用的 Email，我們會寄送重設密碼的連結給你。</p>
      ) : (
        <>
          <button type="button" className="login-google" onClick={handleGoogle}>
            <GoogleIcon />
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
          <div className="login-password">
            <div className="login-label-row">
              <label htmlFor="login-password">密碼</label>
              {mode === 'signin' && (
                <button type="button" className="link-button" onClick={() => switchMode('forgot')}>
                  忘記密碼？
                </button>
              )}
            </div>

            <div className="login-password-field">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={mode === 'signup' ? MIN_PASSWORD_LENGTH : undefined}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'signup' ? `至少 ${MIN_PASSWORD_LENGTH} 個字元` : undefined}
              />

              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                aria-pressed={showPassword}
              >
                <EyeIcon open={!showPassword} />
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <label>
            確認密碼
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
        )}

        <button type="submit" className="button login-cta" disabled={submitting}>
          {submitting ? '處理中...' : MODES[mode].submit}
        </button>
      </form>

      {errorMessage && <p className="login-message">{errorMessage}</p>}
      {canResendConfirmation && (
        <button type="button" className="button secondary" onClick={handleResendConfirmation}>
          重新寄送驗證信
        </button>
      )}

      {mode === 'signin' && (
        <>
          <div className="login-signup">
            <p>還沒有帳號？使用 Google 登入會自動建立帳號。</p>
            <button type="button" className="button secondary login-cta" onClick={() => switchMode('signup')}>
              註冊會員
            </button>
          </div>
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
