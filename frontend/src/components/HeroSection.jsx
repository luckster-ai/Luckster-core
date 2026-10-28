import { Link } from 'react-router-dom'
import heroImage from '../assets/hero/hero-desktop.webp'
import Phrases from './Phrases'

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
//
// Payment Readiness Implementation Sprint (2026-09): 訂閱會員 now points
// at /pricing (was /login, indistinguishable from 免費體驗). 免費體驗
// keeps its existing /login behaviour -- unchanged, per Sprint scope.
//
// Website Refinement (2026-10): the secondary button now reads 購買方案
// (was 訂閱會員) so it doesn't suggest an automatic recurring charge;
// same /pricing link.
//
// Website Refinement (2026-10): the image moved to the TOP of the Hero
// (image → H1 → English → mission → encouragement → CTAs → hook → what)
// so visitors see the practice visual first; it keeps its 16:9 frame on
// every width (the figure and the JOTI wordmark sit at opposite sides, so
// any taller crop would cut one of them).
function HeroSection({ homepage }) {
  const { hero } = homepage

  return (
    <section className="hero">
      <div className="hero-image">
        <img src={heroImage} alt="昆達里尼瑜伽練習者於溫暖自然光空間中靜坐冥想" />
      </div>

      <h1>{hero.title}</h1>
      <p className="hero-title-en">{hero.titleEn}</p>

      <p className="hero-mission">
        <Phrases text={hero.mission} mobileLines />
      </p>

      <p className="hero-encouragement">{hero.encouragement}</p>

      <div className="hero-cta">
        <Link to="/login" className="button">
          免費體驗
        </Link>

        <Link to="/pricing" className="button secondary">
          購買方案
        </Link>
      </div>

      <div className="hero-message">
        <div className="hero-hook">
          {hero.hook.map((line, index) => (
            <p key={index}>
              <Phrases text={line.text} mobileLines={line.mobileLines} />
            </p>
          ))}
        </div>

        <div className="hero-what">
          {hero.what.map((line, index) => (
            <p key={index}>
              <Phrases text={line.text} mobileLines={line.mobileLines} />
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HeroSection
