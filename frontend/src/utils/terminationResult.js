// Step 11.2 -- Refund Failure UI.
//
// Turns the result of supabase.functions.invoke('terminate-service-period')
// into a member-facing message plus "should the profile be reloaded".
// terminate-service-period runs in two stages (see its index.ts): (1) the
// termination + refund calculation commit atomically, (2) only then is the
// provider refund attempted. So a non-2xx response does NOT mean nothing
// happened -- a refund failure comes back as 502 { status: 'refund_failed' }
// with the Service Period already terminated.
//
// On a non-2xx, supabase-js returns data = null and puts the raw Response
// on error.context (FunctionsHttpError / FunctionsRelayError); a network
// failure (FunctionsFetchError) has no response at all.

const TERMINATED_REFUNDED = '已提前終止目前方案，退款已送出，款項將依發卡銀行作業時間退回。'
const TERMINATED_REFUND_PENDING =
  '已提前終止目前方案，退款金額已依契約第十一條計算，但退款尚未完成。如有疑問，請與我們聯絡。'
const UNKNOWN = '無法確認處理結果，已重新載入方案狀態。如有疑問，請與我們聯絡。'
const NOT_ELIGIBLE = '此方案目前無法提前終止（可能已終止或已到期），已重新載入方案狀態。'
const ORDER_NOT_REFUNDABLE = '這筆訂單目前無法辦理退款，方案未變更。如有疑問，請與我們聯絡。'
const FAILED_UNCHANGED = '提前終止失敗，方案未變更，請稍後再試。'
const SIGNED_OUT = '登入狀態已失效，請重新登入後再試。'

// Errors the backend only returns AFTER the termination transaction has
// committed (Service Period already terminated).
function isPostTerminationError(code) {
  return (
    typeof code === 'string' &&
    (code.startsWith('termination_recorded') || /^refund_.*_mark_failed$/.test(code))
  )
}

// Body of the function's response, whether it succeeded or not.
// Returns null when there is no readable body (network failure, non-JSON).
export async function readTerminationBody(data, error) {
  if (!error) return data ?? null
  const response = error.context
  if (!response || typeof response.json !== 'function') return null
  try {
    return await response.json()
  } catch {
    return null
  }
}

// { kind, message, refresh }
//   kind: 'refunded' | 'refund_pending' | 'not_terminated' | 'unknown'
//   refresh: reload the profile so the page shows the real plan state.
//   Definitely-not-terminated outcomes do not reload.
export function classifyTerminationResult(body) {
  const status = body?.status
  const code = body?.error

  if (status === 'refunded') {
    return { kind: 'refunded', message: TERMINATED_REFUNDED, refresh: true }
  }
  if (status === 'refund_processing' || status === 'refund_failed' || isPostTerminationError(code)) {
    return { kind: 'refund_pending', message: TERMINATED_REFUND_PENDING, refresh: true }
  }

  switch (code) {
    case 'service_period_not_eligible':
      // Not terminated by THIS call, but usually means the page is stale
      // (already terminated / expired) -- reloading only reads state.
      return { kind: 'not_terminated', message: NOT_ELIGIBLE, refresh: true }
    case 'order_not_eligible_for_refund':
      return { kind: 'not_terminated', message: ORDER_NOT_REFUNDABLE, refresh: false }
    case 'unauthorized':
      return { kind: 'not_terminated', message: SIGNED_OUT, refresh: false }
    case 'termination_failed':
    case 'service_period_id_required':
    case 'method_not_allowed':
      return { kind: 'not_terminated', message: FAILED_UNCHANGED, refresh: false }
    default:
      return { kind: 'unknown', message: UNKNOWN, refresh: true }
  }
}
