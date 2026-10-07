import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { supabase } from '../lib/supabaseClient'

// Payment Rebuild -- Step 6: where the provider's hosted checkout sends the
// member back to (create-order-checkout / retry-order-payment).
//
// ECPay integration: provider-neutral. The page now reads the member's own
// Order status (orders: read own RLS) instead of trusting the URL --
// ECPay's ClientBackURL carries no `result` at all, and Oen's `result` was
// only ever a redirect hint, never proof of payment. The Order only becomes
// 'paid' after the provider's webhook has been verified server-side
// (oen-webhook / ecpay-webhook -> apply_order_payment()), so while it is
// still pending_payment this page re-reads it a few times. It never
// decides entitlement itself.
const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 10

function CheckoutReturnPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('order')
  const resultHint = searchParams.get('result')
  const { user, loading, refreshProfile } = useAuth()

  const [orderStatus, setOrderStatus] = useState(null)
  const [pollsDone, setPollsDone] = useState(false)

  useEffect(() => {
    if (loading || !user || !orderId || !supabase) return undefined

    let cancelled = false
    let polls = 0
    let timer = null

    async function load() {
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle()
      if (cancelled) return

      const status = data?.status ?? null
      setOrderStatus(status)

      if (status === 'paid') {
        refreshProfile?.()
        return
      }
      polls += 1
      if (status === 'pending_payment' && polls < MAX_POLLS) {
        timer = setTimeout(load, POLL_INTERVAL_MS)
      } else {
        setPollsDone(true)
      }
    }

    load()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
    // refreshProfile is recreated on every AuthProvider render; only the
    // Order identity and the signed-in user should restart polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, orderId])

  let message
  if (!orderId) {
    message = '找不到付款結果資訊。'
  } else if (orderStatus === 'paid') {
    message = '付款已確認，你的帳號狀態已更新。'
  } else if (orderStatus === 'payment_failed' || (resultHint === 'failed' && orderStatus === 'pending_payment')) {
    message = '這次付款未完成。你可以回到帳號頁面重新嘗試，或稍後再試一次。'
  } else if (orderStatus === 'payment_expired') {
    message = '這筆訂單的付款期限已過，請重新選擇方案。'
  } else if (orderStatus === 'pending_payment' && pollsDone) {
    message = '尚未收到付款結果。如果你已完成付款，確認可能需要幾分鐘，稍後可在我的帳號查看最新狀態。'
  } else if (orderStatus && orderStatus !== 'pending_payment') {
    message = '訂單狀態已更新，請前往我的帳號查看。'
  } else if (!orderStatus && pollsDone) {
    message = '找不到這筆訂單，請前往我的帳號查看。'
  } else if (!loading && !user) {
    message = '請先登入以查看付款結果。'
  } else {
    message = '正在確認付款結果，請稍候…'
  }

  return (
    <div className="auth-page">
      <h1>付款處理狀態</h1>

      <p>{message}</p>

      <Link to="/account" className="button">
        前往我的帳號
      </Link>
    </div>
  )
}

export default CheckoutReturnPage
