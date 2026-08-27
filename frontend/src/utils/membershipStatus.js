// Membership / Authentication Foundation (Phase 2A).
//
// Pure, derived status -- mirrors the SQL logic in
// supabase/schema.sql's get_membership_status() function exactly, so
// the client can show the same answer without a round trip. This is a
// DISPLAY/architecture piece only: nothing in the app currently gates
// Module playback or Practice access on this value (see the Phase 2A
// report for why real enforcement is deliberately a separate, later
// phase). Once real gating exists, the SQL function is the one that
// must be trusted -- a client-computed value like this one can always
// be tampered with, the same way Bunny-readiness is deliberately
// derived rather than a stored flag (see validateOfficialPractice.js).
const TRIAL_DAYS = 30
const TRIAL_SECONDS = 30 * 60 * 60

export const MEMBERSHIP_STATUS = {
  ADMIN: 'admin',
  TRIAL: 'trial',
  TRIAL_EXPIRED: 'trial_expired'
}

export function getMembershipStatus(profile) {
  if (!profile) return null
  if (profile.role === 'admin') return MEMBERSHIP_STATUS.ADMIN

  const trialStartedAt = profile.trial_started_at ? new Date(profile.trial_started_at) : null
  const daysElapsed = trialStartedAt
    ? (Date.now() - trialStartedAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity
  const secondsUsed = profile.module_usage_seconds || 0

  const trialActive = daysElapsed < TRIAL_DAYS && secondsUsed < TRIAL_SECONDS

  return trialActive ? MEMBERSHIP_STATUS.TRIAL : MEMBERSHIP_STATUS.TRIAL_EXPIRED
}
