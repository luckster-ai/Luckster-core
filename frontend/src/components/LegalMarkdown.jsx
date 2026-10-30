import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Renders a legal document (contract / privacy policy) from markdown for
// the public /legal pages and the Contract Review Gate. remark-gfm for the
// documents' tables. A paragraph that opens with a clause number
// ("一、", "十一、") gets a hanging indent as wide as that number, so its
// wrapped lines line up with the clause text (see .legal-clause in
// App.css); everything else renders as plain markdown.
const CLAUSE_NUMBER = /^[一二三四五六七八九十]+、/

function Paragraph({ node, ...props }) {
  const first = node?.children?.[0]
  const match = first?.type === 'text' ? first.value.match(CLAUSE_NUMBER) : null

  if (!match) return <p {...props} />

  return <p {...props} className="legal-clause" style={{ '--clause-indent': `${match[0].length}em` }} />
}

const COMPONENTS = { p: Paragraph }

function LegalMarkdown({ children }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
      {children}
    </ReactMarkdown>
  )
}

export default LegalMarkdown
