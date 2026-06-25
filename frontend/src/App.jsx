import homepage from './data/homepage'
import teacher from './data/teacher'
import courses from './data/courses'

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
        <h2>{teacher.name}</h2>

        <p>
          {teacher.description}
        </p>

        <p>
          {teacher.mission}
        </p>
      </section>

      <section className="practice">
        <h2>推薦課程</h2>

        <div className="cards">

          {courses.map((course) => (
            <div
              key={course.id}
              className="card"
            >
              <h3>{course.title}</h3>

              <p>{course.level}</p>

              <p>{course.duration}</p>

              <p>{course.description}</p>
            </div>
          ))}

        </div>
      </section>

      <footer>
        © JOTI Kundalini ABC Yoga
      </footer>
    </div>
  )
}

export default App