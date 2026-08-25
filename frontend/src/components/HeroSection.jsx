import heroImage from '../assets/hero/hero-desktop.png'

function HeroSection({ homepage }) {
  return (
    <section className="hero">
      <div className="hero-image">
        <img src={heroImage} alt="昆達里尼瑜伽練習者於溫暖自然光空間中靜坐冥想" />
      </div>

      <p className="hero-brand-name">{homepage.brand.name}</p>
      <p className="hero-brand-subtitle">{homepage.brand.subtitleEn}</p>

      <h1>{homepage.hero.title}</h1>

      <p>{homepage.brand.taglineEn}</p>

      <p className="subtitle">
        {homepage.hero.subtitle}
      </p>

      <p>{homepage.hero.description}</p>
    </section>
  )
}

export default HeroSection
