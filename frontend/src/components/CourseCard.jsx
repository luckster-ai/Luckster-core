function CourseCard({ course }) {
  return (
    <div className="card">
      <h3>{course.title}</h3>

      <p>{course.level}</p>

      <p>{course.duration}</p>

      <p>{course.description}</p>
    </div>
  )
}

export default CourseCard