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
//
// ECPay Checkout Session flow: ECPay purchases come back with
// ?session=<checkout session id> instead (there is no Order until payment
// is verified) and are handled by SessionReturn below; ?order= stays for
// the Oen order-first flow, unchanged.
const POLL_INTERVAL_MS = 3000
const MAX_POLLS = 10
// confirm-checkout-session re-queries ECPay (QueryTradeInfo) -- only on
// every 3rd poll, to stay well clear of ECPay's query rate limit; the
// polls in between just re-read the session row.
const CONFIRM_EVERY_N_POLLS = 3

function CheckoutReturnPage() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session')
  if (sessionId) return <SessionReturn sessionId={sessionId} />
  return <OrderReturn orderId={searchParams.get('order')} resultHint={searchParams.get('result')} />
}

function SessionReturn({ sessionId }) {
  const { user, loading, refreshProfile } = useAuth()

  const [sessionStatus, setSessionStatus] = useState(null) // open | fulfilled | rejected | not_found
  const [pollsDone, setPollsDone] = useState(false)

  useEffect(() => {
    if (loading || !user || !supabase) return undefined

    let cancelled = false
    let polls = 0
    let timer = null

    async function readStatus() {
      if (polls % CONFIRM_EVERY_N_POLLS === 0) {
        const { data, error } = await supabase.functions.invoke('confirm-checkout-session', {
          body: { sessionId }
        })
        if (data?.status) return data.status
        if (data?.error === 'session_not_found') return 'not_found'
        if (!error) return null
        // fall through to a plain read if the function call itself failed
      }
      const { data } = await supabase
        .from('checkout_sessions')
        .select('status')
        .eq('id', sessionId)
        .maybeSingle()
      return data?.status ?? 'not_found'
    }

    async function load() {
      const status = await readStatus()
      if (cancelled) return
      setSessionStatus(status)

      if (status === 'fulfilled') {
        refreshProfile?.()
        return
      }
      polls += 1
      if ((status === 'open' || status === null) && polls < MAX_POLLS) {
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
    // session identity and the signed-in user should restart polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, sessionId])

  let message
  if (!loading && !user) {
    message = '請先登入以查看付款結果。'
  } else if (sessionStatus === 'fulfilled') {
    message = '付款已確認，你的帳號狀態已更新。'
  } else if (sessionStatus === 'rejected') {
    message =
      '已收到你的付款，但這筆付款無法自動開通（例如你目前已有有效的方案）。我們會以人工方式為你辦理退款，如有疑問請與我們聯絡。'
  } else if (sessionStatus === 'not_found') {
    message = '找不到這筆付款資訊，請前往我的帳號查看。'
  } else if (pollsDone) {
    message =
      '尚未收到付款結果。如果你已完成付款，確認可能需要幾分鐘，稍後可在我的帳號查看最新狀態；如果沒有完成付款，這次購買不會成立。'
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

function OrderReturn({ orderId, resultHint }) {
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
