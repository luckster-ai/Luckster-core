import { Link } from 'react-router-dom'

// Payment Readiness Implementation Sprint (2026-09).
//
// Single findable entry point for JOTI's public legal documents --
// linked from the Footer. Each card routes to /legal/:doc (LegalPage),
// which renders the actual document content.
const LEGAL_LINKS = [
  { doc: 'terms', title: '會員服務契約', description: '完整的會員服務基本契約全文，含方案、試用、續購與終止規則。' },
  { doc: 'privacy', title: '隱私權政策', description: 'JOTI 如何蒐集、處理及利用你的個人資料。' },
  { doc: 'refund', title: '退款政策', description: '提前終止服務期間時，退款如何計算。' },
  { doc: 'cancellation', title: '取消／續購政策', description: '為什麼不需要「取消訂閱」，以及服務期間到期後會發生什麼事。' }
]

function LegalHubPage() {
  return (
    <div className="legal-page">
      <h1>法律與方案資訊</h1>
      <p className="subtitle">JOTI 的完整法律文件與方案規則，公開提供所有使用者查閱。</p>

      <div className="cards legal-hub-cards">
        {LEGAL_LINKS.map((link) => (
          <Link to={`/legal/${link.doc}`} className="card" key={link.doc}>
            <h2>{link.title}</h2>
            <p>{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default LegalHubPage
