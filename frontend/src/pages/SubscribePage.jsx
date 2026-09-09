import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { supabase } from '../lib/supabaseClient'
import { getMembershipStatus, MEMBERSHIP_STATUS } from '../utils/membershipStatus'

// Payment Phase 1 -- Oen TEST first-subscription MVP.
//
// This page is registered in AppRouter ONLY when VITE_ENABLE_SUBSCRIBE
// === 'true', which is set only on the Vercel Preview deployment (A4) --
// production `main` has no subscribe entry point. The
// create-subscription-checkout Edge Function additionally enforces a
// server-side user allowlist (A3), so reaching this page is not enough to
// start a checkout.
//
// No Oen secret ever touches the frontend: the button only calls our own
// Edge Function, which returns the Oen hosted-checkout URL to redirect to.
function SubscribePage() {
  const { loading, user, profile } = useAuth()
  const [state, setState] = useState('idle') // idle | creating | error
  const [message, setMessage] = useState(null)

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  const status = getMembershipStatus(profile)
  const alreadyPaid = status === MEMBERSHIP_STATUS.SUBSCRIBER

  async function startCheckout() {
    setState('creating')
    setMessage(null)

    const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
      body: { planId: 'joti_monthly_test' }
    })

    if (error || !data?.checkoutUrl) {
      setState('error')
      setMessage(data?.error || error?.message || '建立付款失敗，請稍後再試。')
      return
    }

    window.location.assign(data.checkoutUrl)
  }

  return (
    <div className="auth-page">
      <h1>訂閱 JOTI（測試）</h1>

      {alreadyPaid ? (
        <p>你已經是付費會員。</p>
      ) : (
        <>
          <p>JOTI 月訂閱 · 完整課程存取。</p>
          <p className="subtitle">這是 Oen 測試環境，不會產生真實扣款。</p>

          <button
            type="button"
            className="button"
            onClick={startCheckout}
            disabled={state === 'creating'}
          >
            {state === 'creating' ? '前往付款頁…' : '開始訂閱'}
          </button>

          {state === 'error' && <p>{message}</p>}
        </>
      )}
    </div>
  )
}

export default SubscribePage
