import { Link } from 'react-router-dom'
import heroImage from '../assets/hero/hero-desktop.png'

// Homepage Hero (2026-09): the first viewport -- desktop AND mobile --
// must show the CTAs without the visitor first scrolling past the long
// copy, so the render order is:
//   H1 → English → mission → the low-barrier line → CTAs → image → hook → what
// The image and the fuller hook / what copy deliberately sit below the
// CTAs. 免費體驗 (primary) / 訂閱會員 (secondary) both point at /login for
// now (Payment destination out of scope); 訂閱會員 only needs its target
// swapped once a real plan/pricing page exists.
//
// hero.mission is JOTI's brand / mission statement -- given a clear step
// above body copy (.hero-mission), but kept below the H1 and the CTAs in
// visual weight.
function HeroSection({ homepage }) {
  const { hero } = homepage

  return (
    <section className="hero">
      <h1>{hero.title}</h1>
      <p className="hero-title-en">{hero.titleEn}</p>

      <p className="hero-mission">{hero.mission}</p>

      <p className="hero-encouragement">{hero.encouragement}</p>

      <div className="hero-cta">
        <Link to="/login" className="button">
          免費體驗
        </Link>

        <Link to="/login" className="button secondary">
          訂閱會員
        </Link>
      </div>

      <div className="hero-image">
        <img src={heroImage} alt="昆達里尼瑜伽練習者於溫暖自然光空間中靜坐冥想" />
      </div>

      <div className="hero-message">
        <div className="hero-hook">
          {hero.hook.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="hero-what">
          {hero.what.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
