import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { AUTH_CALLBACK_PATH, AuthContext, RESET_PASSWORD_PATH } from './authContext'

function redirectUrl(path) {
  return `${window.location.origin}${path}`
}

// Membership / Authentication Foundation (Phase 2A).
//
// `profile` mirrors the public.profiles row (role, trial_started_at,
// module_usage_seconds, marketing_consent) -- see supabase/schema.sql
// for the source of truth and the trigger that creates this row
// automatically on signup, via any method. See utils/membershipStatus.js
// for the derived status Phase 4E's playback gating reads from this
// value, and refreshProfile() below for how that value is kept
// reasonably current during an active session.
//
// isConfigured is false whenever Supabase env vars aren't set (see
// lib/supabaseClient.js) -- lets every page that uses useAuth() render
// a graceful "not set up yet" state instead of crashing, before a
// Supabase project actually exists.
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  // Starts false (nothing to load) when Supabase isn't configured at
  // all, so the effect below never needs to call setLoading
  // synchronously for that branch -- only the real async getSession()
  // path (inside a .then callback, not the effect body itself) does.
  const [loading, setLoading] = useState(() => Boolean(supabase))
  // True from the PASSWORD_RECOVERY event (member arrived via a reset
  // password email link) until the new password is saved or they sign
  // out. That link signs the member in, so without this they would just
  // land on /account with no chance to set a new password.
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return
    }

    // Payment Rebuild -- Step 8 (Membership / Entitlement): service_periods
    // is a separate table (public.service_periods, not a profiles column),
    // fetched alongside the profile row and merged on as `servicePeriods`
    // so utils/membershipStatus.js's still-single-argument getMembershipStatus()
    // can read both without every call site needing to pass a second
    // argument. Filtered server-side to rows that could still matter
    // (not terminated, not yet ended) -- a currently-active OR a
    // future-start ("到期後開始", Plan Change, Step 10) row;
    // already-elapsed rows are excluded here rather than left for the
    // client to filter out of a growing, unbounded history.
    const [{ data: profileData }, { data: periodsData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase
        .from('service_periods')
        // Payment Rebuild -- Step 10: `id` added so Plan Change UI
        // (AccountPage) can reference the active period when calling
        // terminate-service-period -- not used by entitlement logic itself.
        .select('id, plan_code, service_period_start, service_period_end, terminated_at')
        .eq('user_id', userId)
        .is('terminated_at', null)
        .gt('service_period_end', new Date().toISOString())
    ])

    setProfile(profileData ? { ...profileData, servicePeriods: periodsData || [] } : null)
  }, [])

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    supabase.auth.getSession().then(({ data: { session: current } }) => {
      if (!isMounted) return
      setSession(current)
      if (current?.user) loadProfile(current.user.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, current) => {
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setIsPasswordRecovery(false)
      setSession(current)
      if (current?.user) {
        loadProfile(current.user.id)
      } else {
        setProfile(null)
      }
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  // The reset email normally redirects straight to RESET_PASSWORD_PATH,
  // but if that URL isn't in the project's Redirect URLs allow list
  // Supabase falls back to Site URL -- send the member to the reset page
  // from wherever the recovery session actually landed.
  useEffect(() => {
    if (isPasswordRecovery && location.pathname !== RESET_PASSWORD_PATH) {
      navigate(RESET_PASSWORD_PATH, { replace: true })
    }
  }, [isPasswordRecovery, location.pathname, navigate])

  const value = {
    isConfigured: Boolean(supabase),
    user: session?.user || null,
    profile,
    loading,
    isPasswordRecovery,

    // Email + Password (replaces the Phase 2A email magic link). With
    // "Confirm email" enabled on the Supabase project, signUp returns no
    // session -- the member must click the verification email, which
    // lands on AUTH_CALLBACK_PATH like Google OAuth does.
    async signUpWithPassword(email, password) {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      return supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl(AUTH_CALLBACK_PATH) }
      })
    },

    async signInWithPassword(email, password) {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      return supabase.auth.signInWithPassword({ email, password })
    },

    async resendSignupConfirmation(email) {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      return supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectUrl(AUTH_CALLBACK_PATH) }
      })
    },

    async sendPasswordResetEmail(email) {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      return supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl(RESET_PASSWORD_PATH)
      })
    },

    // Requires a session -- the recovery session from the reset email
    // link, or an already signed-in member.
    async updatePassword(password) {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      const result = await supabase.auth.updateUser({ password })
      if (!result.error) setIsPasswordRecovery(false)

      return result
    },

    async signInWithGoogle() {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: redirectUrl(AUTH_CALLBACK_PATH) }
      })
    },

    async signOut() {
      if (!supabase) return
      await supabase.auth.signOut()
    },

    // Phase 4E: re-fetches the caller's own profile row without a full
    // page reload/re-login -- module_usage_seconds and trial_started_at
    // are otherwise only ever loaded once per session (above), so
    // nothing would notice a Trial crossing its 30-day/30-hour line
    // mid-session without this. useModuleUsageTracking calls this after
    // every heartbeat that actually credits time; playback entry points
    // also call it once when a Bunny Module mounts, to catch the
    // "30 days passed while idle" case that has no heartbeat to hang off
    // of. A no-op when logged out.
    async refreshProfile() {
      if (!session?.user) return
      await loadProfile(session.user.id)
    },

    // Deliberately separate from account creation/login -- marketing
    // consent is an explicit, later, revocable action, not implied by
    // signing up (see supabase/schema.sql's column comment).
    async setMarketingConsent(consent) {
      if (!supabase || !session?.user) return { error: new Error('尚未登入') }

      const { error } = await supabase
        .from('profiles')
        .update({ marketing_consent: consent, marketing_consent_at: new Date().toISOString() })
        .eq('id', session.user.id)

      if (!error) await loadProfile(session.user.id)

      return { error }
    }
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
