import { Link } from 'react-router-dom'
import homepage from '../data/homepage'
import business from '../data/business'

// Payment Readiness Implementation Sprint (2026-09): adds the legal
// document links and the business/contact info that ECPay/PAYUNi's
// review process needs to find on the public site. Contact info comes
// from data/business.js, sourced from
// docs/legal/joti-online-teaching-contract.md 第一條 -- not invented
// here.
//
// Business & Legal Information Synchronization (2026-09-22): added
// operatorAddress, synced from joti-business-legal-framework.md §2.
function Footer() {
  return (
    <footer>
      <nav>
        <Link to="/about">關於 JOTI</Link>
        <Link to="/pricing">方案</Link>

        <a
          href={homepage.youtube.channelUrl}
          target="_blank"
          rel="noreferrer"
        >
          YouTube
        </a>

        <a
          href="https://www.facebook.com/JotiLivdeepKaur"
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
      </nav>

      <nav className="footer-legal-nav">
        <Link to="/legal/terms">服務條款</Link>
        <Link to="/legal/privacy">隱私權政策</Link>
        <Link to="/legal/refund">退款政策</Link>
        <Link to="/legal/cancellation">取消／續購政策</Link>
      </nav>

      <div className="footer-business">
        <p>{business.operatorName}（{business.operatorType}）</p>
        <p>{business.operatorAddress}</p>
        <p>
          客服信箱：<a href={`mailto:${business.supportEmail}`}>{business.supportEmail}</a>
          {' ／ '}
          客服電話：{business.supportPhone}
        </p>
      </div>

      <p>© JOTI Kundalini Yoga</p>
    </footer>
  )
}

export default Footer
