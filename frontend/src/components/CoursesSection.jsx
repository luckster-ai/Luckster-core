import { Link } from 'react-router-dom'

function CoursesSection() {
  return (
    <section id="courses" className="courses">
      <h2>進入課程</h2>

      <p className="section-description">
        新手必修是開始任何完整練習前的基礎；進入完整練習，你可以自由選擇官方練習或是自己組合成一堂完整的引導練習。
      </p>

      <div className="cards">
        <Link to="/foundations" className="card course-card">
          <h3>新手必修 Foundation</h3>

          <p>學習正式練習前需要具備的基礎知識與技巧。</p>
        </Link>

        <Link to="/practice" className="card course-card">
          <h3>完整練習 Full Practice</h3>

          <p>開始今日的完整引導練習。</p>
        </Link>
      </div>
    </section>
  )
}

export default CoursesSection
