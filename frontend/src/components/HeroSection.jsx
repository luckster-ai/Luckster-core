function HeroSection({ homepage }) {
  return (
    <section className="hero">
      <h1>{homepage.hero.title}</h1>

      <p>{homepage.brand.taglineEn}</p>

      <p className="subtitle">
        {homepage.hero.subtitle}
      </p>

      <p>{homepage.hero.description}</p>

      <div className="buttons">
        <button>
          {homepage.hero.primaryButton}
        </button>

        <button className="secondary">
          {homepage.hero.secondaryButton}
        </button>
      </div>
    </section>
  )
}

export default HeroSection