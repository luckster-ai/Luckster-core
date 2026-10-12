import { supabase } from '../lib/supabaseClient'
import {
  getActivePaidServicePeriod,
  getMembershipStatus,
  getUpcomingServicePeriod,
  MEMBERSHIP_STATUS
} from './membershipStatus'

// Step 11.1 -- Renewal Purchase Entry.
//
// Contract 第九條第五項: under a still-existing Basic Agreement, buying a new
// Service Period (續購) does NOT restart the 3-day Contract Review. So a
// member who already has a contract_acceptances row is offered the plan
// buttons directly instead of being sent back into /contract-review.
//
// Display only -- create-order-checkout re-checks the Contract Acceptance
// Gate and (ECPay) create_checkout_session() re-checks "no valid Service
// Period" / "no purchase in progress" server-side.
//
// Known limits (undecided rules, deliberately not handled here): a newer
// contract version with requires_reacceptance = true, and a Basic Agreement
// terminated under 第十條 -- any existing acceptance currently counts.

// true / false, or null when it could not be read -- callers must not
// treat null as "never accepted" (that would send an accepted member back
// into a fresh 3-day review).
export async function getContractAcceptanceState() {
  if (!supabase) return null
  const { data, error } = await supabase.from('contract_acceptances').select('id').limit(1)
  if (error || !Array.isArray(data)) return null
  return data.length > 0
}

// Whether this member may be offered a purchase at all, ignoring contract
// acceptance: no current or future-dated Service Period, not an admin, and
// not a Legacy-subscription subscriber (SUBSCRIBER without a Service
// Period, which the server-side check would not catch).
export function canOfferPurchase(profile) {
  if (!profile) return false
  const status = getMembershipStatus(profile)
  if (status === MEMBERSHIP_STATUS.ADMIN || status === MEMBERSHIP_STATUS.SUBSCRIBER) return false
  return !getActivePaidServicePeriod(profile) && !getUpcomingServicePeriod(profile)
}
