// Membership / Authentication Foundation (Phase 2A). Extended by Phase
// 4E (utils/playbackEntitlement.js) as the actual gating input.
//
// Pure, derived status -- mirrors the SQL logic in
// supabase/schema.sql's get_membership_status() function exactly, so
// the client can show the same answer without a round trip. This value
// is trusted for Phase 4E's playback gating because its INPUTS
// (profile.trial_started_at / module_usage_seconds / role) are already
// protected from direct client tampering by protect_profile_system_fields()
// -- the same reasoning already documented on that trigger. It is not a
// substitute for real content protection (see Bunny signed-URL/token
// delivery, still not implemented -- a client that bypasses the UI
// entirely can still reach the raw Bunny URLs shipped in data/modules.js).
export const TRIAL_DAYS = 30
export const TRIAL_SECONDS = 30 * 60 * 60

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

// Phase 4E: AccountPage's usage/remaining-time display. Deliberately a
// static snapshot of whatever `profile` the caller already has -- no
// live countdown, no polling of its own. usedSeconds can lag behind the
// real server value by up to one usage-tracking heartbeat interval
// while a Module is actively playing elsewhere (see
// hooks/useModuleUsageTracking.js's post-heartbeat refreshProfile()
// call) -- acceptable for a display, and errs toward showing less usage
// than reality, never more, matching the "favor the member" principle.
export function getTrialUsageSummary(profile) {
  if (!profile?.trial_started_at) return null

  const trialStartedAt = new Date(profile.trial_started_at)
  const trialEndsAt = new Date(trialStartedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)

  return {
    usedSeconds: profile.module_usage_seconds || 0,
    totalSeconds: TRIAL_SECONDS,
    trialEndsAt
  }
}
