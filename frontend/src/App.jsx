import homepage from './data/homepage'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          JOTI
        </div>

        <nav>
          <a href="#">首頁</a>
          <a href="#">免費課程</a>
          <a href="#">YouTube</a>
          <a href="#">關於我</a>
        </nav>
      </header>

      <section className="hero">
        <h1>{homepage.hero.title}</h1>

        <p>{homepage.brand.taglineEn}</p>

        <p className="subtitle">
          {homepage.hero.subtitle}
        </p>

        <div className="buttons">
          <button>
            {homepage.hero.primaryButton}
          </button>

          <button className="secondary">
            {homepage.hero.secondaryButton}
          </button>
        </div>
      </section>

      <section className="about">
        <h2>關於 JOTI</h2>

        <p>
          透過簡單、有系統的 ABC 學習法，
          幫助更多人認識昆達里尼瑜伽，
          建立穩定、覺察與充滿能量的人生。
        </p>
      </section>

      <section className="practice">
        <h2>免費練習</h2>

        <div className="cards">
          <div className="card">
            呼吸法
          </div>

          <div className="card">
            冥想
          </div>

          <div className="card">
            奎亞
          </div>
        </div>
      </section>

      <footer>
        © JOTI Kundalini ABC Yoga
      </footer>
    </div>
  )
}

export default App