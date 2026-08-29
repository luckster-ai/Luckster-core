import { MEMBERSHIP_STATUS } from './membershipStatus'

// Trial / Visitor Gating (Phase 4E). The one place that maps "who is
// this (membershipStatus) watching what (provider)" to an actual
// playback capability -- every playback entry point (ModulePage.jsx,
// VideoModule.jsx) calls these instead of each re-deriving the same
// rule, so a future SUBSCRIBER tier (or any other status) only ever
// needs to be added to the allow-list below, never to the call sites.
//
// membershipStatus is whatever getMembershipStatus(profile) returns:
// null (visitor, no profile), or one of MEMBERSHIP_STATUS's values.
// null and TRIAL_EXPIRED deliberately fall through to the same "not in
// the allow-list" result -- a visitor and an expired Trial member are
// meant to have identical Bunny Module access, not two separate rules.
export const MODULE_PREVIEW_SECONDS = 10

const FULL_ACCESS_STATUSES = new Set([MEMBERSHIP_STATUS.ADMIN, MEMBERSHIP_STATUS.TRIAL])

// YouTube-provider Modules (and anything that isn't 'bunny') are never
// gated -- Phase 4A's "YouTube is free content" decision, unchanged.
export function isFullPlaybackModule({ membershipStatus, provider }) {
  if (provider !== 'bunny') return true

  return FULL_ACCESS_STATUSES.has(membershipStatus)
}

// What VideoPlayer's capSeconds prop should be for a given Module +
// member: undefined (no cap) for full access, MODULE_PREVIEW_SECONDS
// otherwise. The one line every playback entry point actually needs.
export function getModuleCapSeconds({ membershipStatus, provider }) {
  return isFullPlaybackModule({ membershipStatus, provider }) ? undefined : MODULE_PREVIEW_SECONDS
}

// Only an active Trial's own Bunny-Module watch time should ever be
// credited -- an admin has nothing to meter, and a visitor/expired
// member is capped at MODULE_PREVIEW_SECONDS regardless, so crediting
// their few preview seconds would just be a pointless RPC call against
// a status that already can't change from it.
export function shouldTrackModuleUsage({ membershipStatus, provider }) {
  return provider === 'bunny' && membershipStatus === MEMBERSHIP_STATUS.TRIAL
}
