// Payment Readiness Implementation Sprint (2026-09).
//
// Loads the LIVE docs/legal/*.md files for the public /legal pages
// (Terms / Privacy / Refund / Cancellation). Deliberately separate from
// contractContent.js, which loads the immutable per-version snapshots
// used by the Contract Review Gate (/contract-review) -- these public
// informational pages always show the current document, not a version
// pinned to a specific Review Session.
//
// Legal / Contract Publication Refinement (2026-09): the glob is an
// explicit file list, NOT '../../../docs/legal/*.md'. A folder-wide glob
// bundled every file in docs/legal/ into the public JS output -- Audit
// confirmed docs/legal/README.md and joti-business-legal-framework.md
// (internal governance docs, never rendered by any route) were shipped
// to every visitor's browser as a result. Add a filename here only when
// it is meant to be public-facing legal content.
const markdownModules = import.meta.glob(
  [
    '../../../docs/legal/joti-online-teaching-contract.md',
    '../../../docs/legal/joti-privacy-policy.md',
    '../../../docs/legal/joti-trial-and-usage-notice.md'
  ],
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

export function getLegalDocument(filename) {
  const path = `../../../docs/legal/${filename}`
  return markdownModules[path] || null
}

// Extracts one "## <heading>" section (up to, but not including, the
// next "## " heading) from a full contract markdown string. Used so the
// Refund / Cancellation pages can show the exact legal text of the
// relevant article instead of a paraphrase -- content stays sourced
// from the single contract document, never duplicated by hand.
export function extractContractSection(markdown, headingText) {
  if (!markdown) return null

  const lines = markdown.split('\n')
  const startIndex = lines.findIndex(
    (line) => line.startsWith('## ') && line.includes(headingText)
  )
  if (startIndex === -1) return null

  const endIndex = lines.findIndex(
    (line, index) => index > startIndex && line.startsWith('## ')
  )

  return lines.slice(startIndex, endIndex === -1 ? lines.length : endIndex).join('\n')
}
