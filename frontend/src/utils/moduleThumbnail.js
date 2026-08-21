// Temporary Module visual-identity strategy (Stage 1A UX prototype,
// approved direction: Option B + A hybrid). Derives a thumbnail directly
// from a Module's existing videoReference instead of introducing a new
// asset field/schema -- this is intentionally NOT the final visual asset
// architecture (see Project Master Review, Visual Asset recommendation).
// It only proves whether a visually-identifiable card feels better than a
// text-only one, using data every Module already has.
export function getModuleThumbnailUrl(module) {
  const ref = module?.videoReference

  if (ref?.provider === 'youtube' && ref.videoId) {
    return `https://img.youtube.com/vi/${ref.videoId}/mqdefault.jpg`
  }

  // Bunny (2026-08-21 Bunny-ready prep) and any other future provider:
  // no thumbnail URL convention exists yet — real Bunny library/pull-zone
  // config doesn't exist until the next (paid) phase, so this returns
  // null rather than guessing a URL shape. Every caller already renders a
  // text-fallback when this is falsy (see PieceCard.jsx, PracticeCard.jsx,
  // etc.), so this is a graceful no-thumbnail state, not a broken one.
  return null
}
