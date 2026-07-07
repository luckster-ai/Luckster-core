function AboutSection({ teacher }) {
  return (
    <section className="about">
      <h2>{teacher.name}</h2>

      <p>{teacher.description}</p>

      <p>{teacher.mission}</p>
    </section>
  )
}

export default AboutSection