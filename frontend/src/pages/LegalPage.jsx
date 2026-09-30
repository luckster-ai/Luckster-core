import { Link, Navigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getLegalDocument, extractContractSection } from '../utils/legalDocuments'

// Payment Readiness Implementation Sprint (2026-09).
//
// Renders one public legal document at /legal/:doc. Reuses the same
// markdown + react-markdown pipeline as ContractReviewPage.jsx /
// contractContent.js, just pointed at the LIVE docs/legal/*.md files
// (via utils/legalDocuments.js) instead of the pinned per-version
// snapshots used by the Contract Review Gate -- these are public
// informational pages, not a Review Session.
//
// 'refund' and 'cancellation' are not separate source documents -- that
// content lives inside the full contract as 第十一條 and 第九條. Rather
// than hand-writing a paraphrase (risking drift from the legal text),
// getContent() extracts the exact article text via
// extractContractSection(), so what's shown is always the same wording
// as the full contract at /legal/terms.
//
// remark-gfm is used here because joti-online-teaching-contract.md /
// joti-privacy-policy.md contain GFM tables, which plain ReactMarkdown
// renders as literal "| a | b |" text. ContractReviewPage.jsx has the
// same latent gap (v1.0.md also has tables) but that's a pre-existing
// Step 4 issue, out of scope for this Sprint -- left untouched, noted
// in the wrap-up report instead of fixed here.
const DOC_CONFIG = {
  terms: {
    title: '會員服務契約',
    subtitle: '本文件為 JOTI 會員服務基本契約全文；會員準備成為正式付費會員時，將完整提供並進入至少 3 日之契約審閱程序。',
    getContent: () => getLegalDocument('joti-online-teaching-contract.md')
  },
  privacy: {
    title: '隱私權政策',
    subtitle: 'JOTI 如何蒐集、處理及利用你的個人資料。',
    getContent: () => getLegalDocument('joti-privacy-policy.md')
  },
  refund: {
    title: '退款政策',
    subtitle: '摘錄自會員服務契約「第十一條　提前終止與退款」，與完整契約文字相同。',
    getContent: () =>
      extractContractSection(getLegalDocument('joti-online-teaching-contract.md'), '第十一條')
  },
  cancellation: {
    title: '取消／續購政策',
    subtitle: '摘錄自會員服務契約「第九條　服務期間屆滿與續購（不自動續約）」，與完整契約文字相同。',
    getContent: () =>
      extractContractSection(getLegalDocument('joti-online-teaching-contract.md'), '第九條')
  }
}

function LegalPage() {
  const { doc } = useParams()
  const config = DOC_CONFIG[doc]

  if (!config) return <Navigate to="/legal" replace />

  const content = config.getContent()

  return (
    <div className="legal-page">
      <Link to="/legal" className="legal-back-link">← 法律與方案資訊</Link>

      <h1>{config.title}</h1>
      <p className="subtitle">{config.subtitle}</p>

      <div className="legal-content">
        {content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        ) : (
          <p>目前無法載入內容。</p>
        )}
      </div>
    </div>
  )
}

export default LegalPage
