// Membership / Authentication Foundation (Phase 2A). Extended by Phase
// 4E (utils/playbackEntitlement.js) as the actual gating input.
//
// Pure, derived status -- mirrors the SQL logic in
// supabase/schema_subscriptions.sql's get_membership_status() function
// exactly (originally supabase/schema.sql; Payment Phase 1 added the
// 'subscriber' branch), so the client can show the same answer without a
// round trip. This value is trusted for Phase 4E's playback gating
// because its INPUTS (profile.trial_started_at / module_usage_seconds /
// role / subscription_status) are already protected from direct client
// tampering by protect_profile_system_fields() -- the same reasoning
// already documented on that trigger. It is not a substitute for real
// content protection (see Bunny signed-URL/token delivery, still not
// implemented -- a client that bypasses the UI entirely can still reach
// the raw Bunny URLs shipped in data/modules.js).
//
// subscription_status is a DERIVED CACHE of the public.subscriptions rows
// (the subscription source of truth), maintained only by the Oen webhook.
// It is `undefined` on profiles loaded before schema_subscriptions.sql is
// run, which correctly falls through to the trial logic.
//
// Payment Rebuild -- Step 8 (Membership / Entitlement): profile.servicePeriods
// is NOT a column on public.profiles -- it's merged onto the profile object
// by AuthProvider.loadProfile() (a separate query against
// public.service_periods, filtered server-side to non-terminated /
// not-yet-ended rows) purely so this still-single-argument function can stay
// the one place both the Service Period and Legacy subscription paths are
// evaluated. Mirrors the service_periods branch added to
// supabase/schema_membership_entitlement.sql's get_membership_status()
// exactly -- see that file for the full reasoning (double-bound EXISTS, not
// latest-row; status column not trusted; terminated_at excludes early
// termination).
export const TRIAL_DAYS = 30
export const TRIAL_SECONDS = 30 * 60 * 60

export const MEMBERSHIP_STATUS = {
  ADMIN: 'admin',
  SUBSCRIBER: 'subscriber',
  TRIAL: 'trial',
  TRIAL_EXPIRED: 'trial_expired'
}

// A Service Period counts toward Paid Access only while the current
// instant falls inside its own [service_period_start, service_period_end)
// window -- a future-start Service Period (Plan Change "到期後開始", not yet
// implemented) deliberately does NOT count yet, and a past one that nothing
// has flipped to status='expired' is excluded by the end-time check itself,
// not by trusting that column.
function isServicePeriodCurrentlyActive(period, nowMs) {
  if (!period || period.terminated_at) return false
  const start = new Date(period.service_period_start).getTime()
  const end = new Date(period.service_period_end).getTime()
  return nowMs >= start && nowMs < end
}

// EXISTS semantics, not "check the latest row" -- a member can have more
// than one service_periods row (e.g. an expired one plus a current one),
// and purchase order is not the same as validity order.
export function hasActiveServicePeriod(profile) {
  const periods = profile?.servicePeriods
  if (!Array.isArray(periods)) return false
  const nowMs = Date.now()
  return periods.some((period) => isServicePeriodCurrentlyActive(period, nowMs))
}

export function getMembershipStatus(profile) {
  if (!profile) return null
  if (profile.role === 'admin') return MEMBERSHIP_STATUS.ADMIN
  if (profile.subscription_status === 'active') return MEMBERSHIP_STATUS.SUBSCRIBER
  if (hasActiveServicePeriod(profile)) return MEMBERSHIP_STATUS.SUBSCRIBER

  const trialStartedAt = profile.trial_started_at ? new Date(profile.trial_started_at) : null
  const daysElapsed = trialStartedAt
    ? (Date.now() - trialStartedAt.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity
  const secondsUsed = profile.module_usage_seconds || 0

  const trialActive = daysElapsed < TRIAL_DAYS && secondsUsed < TRIAL_SECONDS

  return trialActive ? MEMBERSHIP_STATUS.TRIAL : MEMBERSHIP_STATUS.TRIAL_EXPIRED
}

// AccountPage display only -- the currently-active paid Service Period (if
// any) and the soonest upcoming one (if any), for showing plan/expiry and a
// future-start date. Not used for entitlement decisions (see
// hasActiveServicePeriod above); if more than one row is simultaneously
// current -- not expected to happen given the Plan Change non-overlap rule,
// but nothing in this file enforces that -- the first match is shown rather
// than picking among them, since no display priority has been decided.
export function getActivePaidServicePeriod(profile) {
  const periods = profile?.servicePeriods
  if (!Array.isArray(periods)) return null
  const nowMs = Date.now()
  return periods.find((period) => isServicePeriodCurrentlyActive(period, nowMs)) || null
}

export function getUpcomingServicePeriod(profile) {
  const periods = profile?.servicePeriods
  if (!Array.isArray(periods)) return null
  const nowMs = Date.now()
  const upcoming = periods.filter(
    (period) => !period.terminated_at && new Date(period.service_period_start).getTime() > nowMs
  )
  if (upcoming.length === 0) return null

  return upcoming.reduce((soonest, period) =>
    new Date(period.service_period_start) < new Date(soonest.service_period_start) ? period : soonest
  )
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
