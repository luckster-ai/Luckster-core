// Email + Password Auth: maps Supabase Auth errors to member-facing
// Chinese messages. Matches on error.code (stable API error codes, see
// @supabase/auth-js lib/error-codes) first, then error.name for the
// client-side error classes that carry no code (network failures, a
// missing recovery session). Never shows the raw English message.

// Mirrors the Supabase Auth "Minimum password length" project setting
// (set to 8 in the Dashboard) -- checked client-side too so the member
// gets the message before a round trip. No character-class requirement.
export const MIN_PASSWORD_LENGTH = 8

const MESSAGES_BY_CODE = {
  invalid_credentials: 'Email 或密碼不正確，請再試一次。',
  email_not_confirmed: '這個 Email 尚未完成驗證，請先到信箱點擊驗證信中的連結。',
  user_already_exists: '這個 Email 已經註冊，請直接登入或使用「忘記密碼」。',
  email_exists: '這個 Email 已經註冊，請直接登入或使用「忘記密碼」。',
  weak_password: `密碼至少需要 ${MIN_PASSWORD_LENGTH} 個字元。`,
  same_password: '新密碼不能與目前的密碼相同。',
  email_address_invalid: 'Email 格式不正確，請重新確認。',
  over_email_send_rate_limit: '寄信次數過於頻繁，請稍候幾分鐘再試。',
  over_request_rate_limit: '操作次數過於頻繁，請稍候再試。',
  signup_disabled: '目前暫停開放註冊，請稍後再試。',
  email_provider_disabled: '目前暫停開放 Email 登入，請改用 Google 登入。',
  otp_expired: '連結已失效或已過期，請重新申請。',
  session_not_found: '登入狀態已失效，請重新申請重設密碼信。'
}

const MESSAGES_BY_NAME = {
  AuthRetryableFetchError: '網路連線發生問題，請確認網路後再試一次。',
  AuthSessionMissingError: '重設密碼連結已失效，請重新申請重設密碼信。'
}

export function getAuthErrorMessage(error) {
  if (!error) return null
  return (
    MESSAGES_BY_CODE[error.code] ||
    MESSAGES_BY_NAME[error.name] ||
    '發生錯誤，請稍後再試。如果問題持續發生，請與我們聯絡。'
  )
}

export function isEmailNotConfirmed(error) {
  return error?.code === 'email_not_confirmed'
}

export function validateNewPassword(password, confirmPassword) {
  if (password.length < MIN_PASSWORD_LENGTH) return `密碼至少需要 ${MIN_PASSWORD_LENGTH} 個字元。`
  if (password !== confirmPassword) return '兩次輸入的密碼不一致。'
  return null
}

// Supabase reports a failed email-link verification (expired, already
// used, invalid) by redirecting back with error params in the URL hash
// (implicit flow) or query string, and supabase-js leaves them in place
// on failure. Returns a member-facing message, or null when the URL
// carries no auth error.
export function getAuthRedirectErrorMessage(location) {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''))
  const query = new URLSearchParams(location.search)
  const code = params.get('error_code') || query.get('error_code')
  const hasError = code || params.get('error') || query.get('error')

  if (!hasError) return null
  if (code === 'otp_expired') return '這個連結已失效或已過期，請重新申請。'
  // Also covers an OAuth error redirect (e.g. Google sign-in cancelled).
  return '登入或驗證沒有完成，請重新操作一次。'
}
