import { Link } from 'react-router-dom'

function AboutSection({ teacher }) {
  return (
    <section id="about" className="about">
      <h2>{teacher.name}</h2>

      <p>{teacher.description}</p>

      <Link to="/about" className="button secondary">
        閱讀完整故事
      </Link>
    </section>
  )
}

export default AboutSection
