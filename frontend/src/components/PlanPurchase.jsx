import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { startProviderCheckout } from '../utils/startProviderCheckout'
import { CHECKOUT_ERROR_TEXT, getOpenCheckoutSession } from '../utils/checkoutSession'
import { readTerminationBody } from '../utils/terminationResult'

// Step 11.1 -- the plan buttons shared by first purchase (ContractReviewPage,
// right after Agree) and renewal (AccountPage / ContractReviewPage for an
// already-accepted member). Extracted unchanged from ContractReviewPage:
// create-order-checkout -> startProviderCheckout (Oen redirect or ECPay
// signed form POST). Deciding WHO sees this is the caller's job.
//
// ECPay Checkout Session flow: while the member has a purchase in progress
// (open, unexpired checkout session) the buttons are replaced by a
// "付款進行中" notice; create-order-checkout enforces the same rule.
const CHECKOUT_PLANS = [
  {
    code: 'monthly',
    label: '月方案 NT$333',
    note: '月方案 NT$333，服務期間自付款確認起算 1 個月，不會自動續約。'
  },
  {
    code: 'annual',
    label: '年方案 NT$3,333',
    note: '年方案 NT$3,333，服務期間自付款確認起算 1 年，不會自動續約。'
  }
]

function PlanPurchase() {
  const [checkoutPlanCode, setCheckoutPlanCode] = useState(null) // which plan button is in flight, or null
  const [checkoutError, setCheckoutError] = useState(null)
  const [openSession, setOpenSession] = useState(null) // { id, plan_code, expires_at } or null

  useEffect(() => {
    let cancelled = false
    getOpenCheckoutSession().then((session) => {
      if (!cancelled) setOpenSession(session)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCheckout(planCode) {
    setCheckoutPlanCode(planCode)
    setCheckoutError(null)

    const { data, error } = await supabase.functions.invoke('create-order-checkout', {
      body: { planCode }
    })
    // On a non-2xx (e.g. 409) supabase-js returns data = null and the
    // response on error.context -- read the error code from there (same
    // helper as the Step 11.2 termination flow). Unknown codes and network
    // failures fall back to the generic message, never English error text.
    const body = await readTerminationBody(data, error)
    const code = body?.error

    if (error || code || !data?.redirectUrl) {
      setCheckoutPlanCode(null)
      setCheckoutError(CHECKOUT_ERROR_TEXT[code] || '無法建立訂單，請稍後再試。')
      if (code === 'checkout_session_in_progress') {
        getOpenCheckoutSession().then(setOpenSession)
      }
      return
    }

    // Full navigation (not react-router) -- the provider's hosted checkout
    // page is an external origin, not a route inside this SPA. Redirect
    // (Oen) or signed form POST (ECPay) -- see startProviderCheckout.
    startProviderCheckout(data)
  }

  if (openSession) {
    return (
      <p>
        付款進行中。請在原付款頁完成付款；若已放棄付款，可於
        {new Date(openSession.expires_at).toLocaleString('zh-TW')} 後重新選擇方案。
      </p>
    )
  }

  return (
    <>
      <ul className="plan-purchase-notes">
        {CHECKOUT_PLANS.map((plan) => (
          <li key={plan.code}>{plan.note}</li>
        ))}
      </ul>

      {checkoutError && <p>{checkoutError}</p>}

      <div className="pricing-cta">
        {CHECKOUT_PLANS.map((plan) => (
          <button
            key={plan.code}
            type="button"
            className="button"
            onClick={() => handleCheckout(plan.code)}
            disabled={checkoutPlanCode !== null}
          >
            {checkoutPlanCode === plan.code ? '前往付款頁…' : plan.label}
          </button>
        ))}
      </div>
    </>
  )
}

export default PlanPurchase
