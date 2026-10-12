import { supabase } from '../lib/supabaseClient'

// ECPay Checkout Session flow: the member's own purchase currently "in
// progress" -- an open checkout_sessions row whose expires_at has not
// passed (RLS: checkout_sessions read own). While one exists JOTI shows
// "付款進行中" instead of a purchase entry. Display only: the server
// (create_checkout_session()) enforces the same rule independently.
//
// Returns null when there is none, or when it cannot be read (e.g. the
// table does not exist on this environment yet) -- the server-side check
// still applies in that case.
export async function getOpenCheckoutSession() {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('checkout_sessions')
    .select('id, plan_code, expires_at')
    .eq('status', 'open')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}

// Server error codes from create-order-checkout's ECPay branch, as
// member-facing text.
export const CHECKOUT_ERROR_TEXT = {
  checkout_session_in_progress: '你已有一筆付款正在進行中，請先在原付款頁完成付款，或稍後再試。',
  active_service_period_exists: '你目前已有有效的方案，無法重複購買。',
  after_expiry_not_supported: '目前不提供到期後開始的購買。',
  plan_change_not_supported: '目前不提供方案變更。'
}
