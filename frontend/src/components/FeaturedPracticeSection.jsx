import { Link } from 'react-router-dom'
import PracticeCard from './PracticeCard'

// Sprint 2B: a single real-Practice preview on Home, not a second Practice
// Hub. There is currently only one official Practice, so "featured" simply
// means "the one that already exists" -- see the Sprint 2B brief section 6
// ("Do not invent additional Practices"). Reuses PracticeCard as-is; no new
// card variant.
//
// Homepage Section Order Plan (2026-09): adds one primary CTA below the
// card -- the mid-page conversion beat once the visitor understands the
// product but before the trust section, so it targets free sign-up /
// trial only (/login), not subscribe. The quieter 查看所有練習 link stays
// as the secondary navigational option.
function FeaturedPracticeSection({ practice }) {
  if (!practice) return null

  return (
    <section className="home-featured">
      <h2>真實的練習</h2>

      <p className="home-featured-lead">這是一堂你現在就可以開始的完整練習。</p>

      <div className="home-featured-card">
        <PracticeCard practice={practice} />
      </div>

      <Link to="/login" className="button home-featured-cta">
        開始你的第一堂練習
      </Link>

      <Link to="/practice" className="home-featured-more">
        查看所有練習 →
      </Link>
    </section>
  )
}

export default FeaturedPracticeSection
