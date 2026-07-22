import homepage from '../data/homepage'
import teacher from '../data/teacher'
import foundations from '../data/foundations'
import practices from '../data/practices'
import videos from '../data/videos'

import HeroSection from '../components/HeroSection'
import AboutSection from '../components/AboutSection'
import FoundationSection from '../components/FoundationSection'
import PracticeCard from '../components/PracticeCard'
import VideoCard from '../components/VideoCard'

function HomePage() {
  return (
    <>
      <HeroSection homepage={homepage} />

      <FoundationSection foundations={foundations} />

      <AboutSection teacher={teacher} />

      <section className="practice">
        <h2>推薦練習 Practice</h2>

        <p>完整的每日練習流程（會員內容）</p>

        <div className="cards">
          {practices.map((practice) => (
            <PracticeCard
              key={practice.id}
              practice={practice}
            />
          ))}
        </div>
      </section>

      <section className="videos">
        <h2>最新影片</h2>

        <div className="cards">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
            />
          ))}
        </div>
      </section>

      <section className="pricing">
        <h2>JOTI 會員訂閱</h2>

        <p>每月 / 每年訂閱，解鎖完整練習系統</p>

        <button>加入會員</button>
      </section>
    </>
  )
}

export default HomePage