import { Link } from 'react-router-dom'
import about from '../data/about'
import homepage from '../data/homepage'
import openingImage from '../assets/about/about-hero-triptych.png.png'
import yoga2012Image from '../assets/about/about-2012-yoga.png'
import yoga2018Image from '../assets/about/about-2018-yoga.png'
import teacherImage from '../assets/about/about-teacher-journey.png'

const YEAR_IMAGES = {
  2012: { src: yoga2012Image, alt: '2012 年，一次安靜的伸展練習，晨光灑落在室內' },
  2018: { src: yoga2018Image, alt: '2018 年，一處佈置了頌缽與銅鑼的靜心空間' }
}

// Structural/visual reference: docs/design/about-page/about-mockup.html.
// Deliberately NOT ported from the mockup: its serif/Google Fonts pairing
// (site-wide type stays Arial, see body{} at the top of App.css) and its
// IntersectionObserver scroll-reveal animation -- both stay out-of-scope
// by design, not an oversight. What IS kept from the mockup is the
// editorial spirit: every Section reads as its own full-screen magazine
// page (own photo treatment, own type hierarchy, own background), but
// the seven read as one continuous story, in the original about.md
// order. All photography is real now (four assets in
// src/assets/about/) -- no placeholders remain anywhere on this page.
function AboutPage() {
  const [opening, turningPoint, becomingATeacher, whyAbc, sheBelieves, theName, closing] = about

  return (
    <div className="about-page">
      <section className="about-section about-section--opening" id={opening.id}>
        <div className="about-photo about-photo--bleed">
          <img src={openingImage} alt="台北、上海、江蘇——三個城市的天際線與水鄉，Joti 曾經走過的地方" />
        </div>

        <div className="about-section-copy">
          <h1>
            {opening.lines.map((line) => (
              <span className="about-line" key={line}>{line}</span>
            ))}
          </h1>
          <p className="about-note">{opening.note}</p>
        </div>
      </section>

      <section className="about-section about-section--turning-point" id={turningPoint.id}>
        {turningPoint.years.map((item, index) => {
          const direction = index % 2 === 0 ? 'left' : 'right'
          const image = YEAR_IMAGES[item.year]

          return (
            <div className={`about-year-block about-year-block--${direction}`} key={item.year}>
              <div className="about-year-frame">
                <div className="about-year-photo">
                  <img src={image.src} alt={image.alt} />
                  <p className="about-year-caption">{item.headline}</p>
                </div>

                <span className="about-year-numeral" aria-hidden="true">{item.year}</span>
              </div>
            </div>
          )
        })}

        <p className="about-note">{turningPoint.note}</p>
      </section>

      <section className="about-section about-section--teacher" id={becomingATeacher.id}>
        <div className="about-teacher-photo">
          <img src={teacherImage} alt="她多年來研讀的書籍、教材與完成教師培訓的證書，靜靜放在自然光下的桌面上" />
        </div>

        <div className="about-teacher-copy">
          <p className="about-teacher-context">{becomingATeacher.context}</p>
          <p className="about-teacher-quote">{becomingATeacher.pullQuote}</p>
          <p className="about-teacher-credential">{becomingATeacher.credential}</p>
        </div>
      </section>

      <section className="about-section about-section--abc" id={whyAbc.id}>
        <p className="about-intro">{whyAbc.intro}</p>

        <p className="about-kicker">{whyAbc.kicker}</p>

        <div className="about-abc">
          {whyAbc.abc.map((item) => (
            <div className="about-abc-item" key={item.letter}>
              <span className="about-abc-letter">{item.letter}</span>
              <span className="about-abc-label">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="about-note">{whyAbc.note}</p>
      </section>

      <section className="about-section about-section--believes" id={sheBelieves.id}>
        <span className="about-believes-mark" aria-hidden="true">“</span>

        <blockquote>
          {sheBelieves.quote.map((line) => (
            <span className="about-line" key={line}>{line}</span>
          ))}
        </blockquote>
      </section>

      <section className="about-section about-section--name" id={theName.id}>
        <p className="about-intro">{theName.intro}</p>
        <p className="about-name">{theName.name}</p>
        <p className="about-meaning">
          {theName.meaning.map((line) => (
            <span className="about-line" key={line}>{line}</span>
          ))}
        </p>
      </section>

      <section className="about-section about-section--closing" id={closing.id}>
        <h2>{closing.headline}</h2>

        <div className="about-cta-group">
          <Link to="/" className="button secondary">回到首頁</Link>
          <Link to="/practice" className="button">開始練習</Link>
        </div>

        <p className="about-colophon">{homepage.brand.name} {homepage.brand.subtitleEn}</p>
      </section>
    </div>
  )
}

export default AboutPage
