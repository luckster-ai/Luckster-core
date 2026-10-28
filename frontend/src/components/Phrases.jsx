// W13 (2026-10): controlled line breaks for short centered / card copy.
// `text` is either a plain string, or an array of phrases that together
// make up the exact sentence (joined with no separator, so the copy is
// unchanged). Each phrase is an inline-block, so a line can only break
// BETWEEN phrases -- never inside a word like 一步｜步. A phrase longer
// than its container still wraps inside itself (no nowrap overflow).
//
// mobileLines: on phones (≤768px) every phrase also starts its own line,
// for copy whose mobile rhythm is fixed (Hero mission / brand message).
// Desktop and tablet keep the phrases on one line whenever they fit.
function Phrases({ text, mobileLines = false }) {
  if (!Array.isArray(text)) return text

  const className = mobileLines ? 'phrase phrase--mobile-line' : 'phrase'

  return text.map((phrase) => (
    <span key={phrase} className={className}>
      {phrase}
    </span>
  ))
}

export default Phrases
