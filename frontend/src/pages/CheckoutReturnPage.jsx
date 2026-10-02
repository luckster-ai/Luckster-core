import { Link, useSearchParams } from 'react-router-dom'

// Payment Rebuild -- Step 6: Oen One-time Checkout.
//
// Where Oen's hosted checkout page redirects back to after the member
// finishes (or abandons) the payment form (successUrl / failureUrl, set by
// create-order-checkout / retry-order-payment). This page deliberately does
// NOT look up the Order, does NOT poll membership status, and does NOT
// decide whether the member is now a paying member -- `result=success` in
// the URL is just Oen's redirect outcome, not server-verified proof of
// payment (see oen-webhook/index.ts's own "never trust the webhook payload
// alone" comment for the same principle applied there). Whether the Order
// actually reached orders.status='paid' is entirely Step 7's concern
// (webhook + server-side re-query verification against apply_order_payment()),
// and whether that should change what the member sees here or on /account
// is Step 8's (Membership / Entitlement) concern -- neither is implemented
// yet, so this page only acknowledges that the member has returned from
// Oen, nothing more.
function CheckoutReturnPage() {
  const [searchParams] = useSearchParams()
  const result = searchParams.get('result')

  return (
    <div className="auth-page">
      <h1>付款處理狀態</h1>

      {result === 'success' && (
        <p>我們已收到 Oen 回傳的付款結果，正在確認中。確認完成後，你的帳號狀態會自動更新。</p>
      )}

      {result === 'failed' && (
        <p>這次付款未完成。你可以回到帳號頁面重新嘗試，或稍後再試一次。</p>
      )}

      {result !== 'success' && result !== 'failed' && (
        <p>找不到付款結果資訊。</p>
      )}

      <Link to="/account" className="button">
        前往我的帳號
      </Link>
    </div>
  )
}

export default CheckoutReturnPage
