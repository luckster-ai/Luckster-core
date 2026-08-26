// Official Practice Architecture — Phase 1.
//
// Minimal Practice-level lifecycle: `status` is optional and only
// meaningful for hand-authored (non-custom) Practices in data/practices.js.
// Absent status means "published" -- this is what keeps P001 (and any
// Practice saved before this field existed) visible with zero data
// migration. There is deliberately no third state, no review workflow,
// no version history: `draft` just means "not yet ready to list", and
// flipping the string to `published` (or deleting the field) is the
// entire publish action.
//
// Custom Practices (isCustom: true) never carry `status` and are not
// filtered by it -- they're already only visible to the learner who
// created them (single-device localStorage), so there's no equivalent
// "hide from everyone" need for those.
export function isPublished(practice) {
  return practice.status !== 'draft'
}
