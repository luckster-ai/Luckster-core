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

  return null
}
