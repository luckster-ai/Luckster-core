import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './authContext'

// Membership / Authentication Foundation (Phase 2A).
//
// `profile` mirrors the public.profiles row (role, trial_started_at,
// module_usage_seconds, marketing_consent) -- see supabase/schema.sql
// for the source of truth and the trigger that creates this row
// automatically on signup, via any method. This context only reads/
// displays it; nothing here enforces access -- see
// utils/membershipStatus.js for the derived status this data supports,
// not yet wired into any gating.
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

  const loadProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setProfile(null)
      return
    }

    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()

    setProfile(data || null)
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

    const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => {
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

  const value = {
    isConfigured: Boolean(supabase),
    user: session?.user || null,
    profile,
    loading,

    // Passwordless by design (Phase 2A): no password to set, leak, or
    // reset -- lower onboarding friction and one less thing to secure.
    async sendMagicLink(email) {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      return supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
    },

    async signInWithGoogle() {
      if (!supabase) return { error: new Error('尚未設定登入服務') }

      return supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` }
      })
    },

    async signOut() {
      if (!supabase) return
      await supabase.auth.signOut()
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
