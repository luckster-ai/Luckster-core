import { Link } from 'react-router-dom'
import PracticeCard from './PracticeCard'

function PracticeHub({ practices }) {
  return (
    <section className="practice-hub">
      <h2>開始練習</h2>

      <p className="section-description">
        選擇一堂完整的引導練習，跟著步驟開始今天的 Kundalini Yoga 練習。
      </p>

      <Link to="/practice/build" className="button practice-hub-build-link">
        建立新課程
      </Link>

      <div className="cards">
        {practices.map((practice) => (
          <Link
            key={practice.id}
            to={`/practices/${practice.slug}`}
            className="card-link"
          >
            <PracticeCard practice={practice} />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default PracticeHub
