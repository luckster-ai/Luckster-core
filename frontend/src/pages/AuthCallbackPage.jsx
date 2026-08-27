import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'

// Membership / Authentication Foundation (Phase 2A). Supabase's client
// parses the magic-link/OAuth redirect URL and establishes the session
// automatically (detectSessionInUrl defaults to true) -- this page just
// waits for that to resolve, then routes onward. Both Google OAuth and
// the email magic link redirect here (see AuthContext's redirectTo/
// emailRedirectTo), so this is the one place that needs to exist for
// either login method to complete.
function AuthCallbackPage() {
  const { loading, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    navigate(user ? '/account' : '/login', { replace: true })
  }, [loading, user, navigate])

  return (
    <div className="auth-page">
      <p>登入中，請稍候...</p>
    </div>
  )
}

export default AuthCallbackPage
