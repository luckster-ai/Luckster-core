import homepage from '../data/homepage'
import teacher from '../data/teacher'

import HeroSection from '../components/HeroSection'
import CoursesSection from '../components/CoursesSection'
import AboutSection from '../components/AboutSection'
import ExternalLinksSection from '../components/ExternalLinksSection'

function HomePage() {
  return (
    <>
      <HeroSection homepage={homepage} />

      <CoursesSection />

      <AboutSection teacher={teacher} />

      <ExternalLinksSection homepage={homepage} />
    </>
  )
}

export default HomePage
