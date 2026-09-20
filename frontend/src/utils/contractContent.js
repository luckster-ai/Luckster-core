// Payment Rebuild -- Step 4: Contract Review & Acceptance Flow.
//
// Loads the immutable per-version Basic Agreement snapshots from
// docs/legal/versions/ (outside src/, see vite.config.js's server.fs.allow
// for why that path is reachable at all). Deliberately NOT reading
// docs/legal/joti-online-teaching-contract.md directly -- that file is the
// live/working draft and can change at any time; a Review Session must
// always resolve to the exact text that was presented when it was pinned
// (contract_versions.content_identifier), never "whatever the live file
// currently says". See order-schema-proposal.md / Step 4 Final
// Implementation Plan for why this distinction matters.
const markdownModules = import.meta.glob(
  '../../../docs/legal/versions/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

// contentIdentifier is the bare version string (e.g. "v1.0"), matching
// contract_versions.content_identifier -- resolved here to the archived
// file's path.
export function getContractContent(contentIdentifier) {
  if (!contentIdentifier) return null

  const path = `../../../docs/legal/versions/${contentIdentifier}.md`
  return markdownModules[path] || null
}
