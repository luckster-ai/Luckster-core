import { Link } from 'react-router-dom'
import Phrases from './Phrases'

// W13 (2026-10): the section description was folded into the two cards.
// Card copy is split into phrases so it only wraps between them (no
// breaks inside a word) and is a left-aligned bullet list for scanning.
function CoursesSection() {
  return (
    <section id="courses" className="courses">
      <h2>進入課程</h2>

      <div className="cards">
        <Link to="/foundations" className="card course-card">
          <h3>新手必修 <span className="free-badge">免費</span></h3>

          <ul className="course-card-points">
            <li>
              <Phrases text={['是開始任何', '完整練習前的', '基礎與技巧。']} />
            </li>
            <li>
              <Phrases text={['所有人都能免費觀看，', '不需要註冊。']} />
            </li>
          </ul>
        </Link>

        <Link to="/practice" className="card course-card">
          <h3>完整練習</h3>

          <ul className="course-card-points">
            <li>開始今日的完整練習。</li>
            <li>
              <Phrases text={['你可以自由選擇', '官方練習', '或是', '自己組合成', '一堂完整的引導練習。']} />
            </li>
          </ul>
        </Link>
      </div>
    </section>
  )
}

export default CoursesSection
