import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import homepage from '../data/homepage'
import teacher from '../data/teacher'
import { useOfficialPractices } from '../hooks/useOfficialPractices'

import HeroSection from '../components/HeroSection'
import CoursesSection from '../components/CoursesSection'
import FeaturedPracticeSection from '../components/FeaturedPracticeSection'
import PracticeFlowStrip from '../components/PracticeFlowStrip'
import AboutSection from '../components/AboutSection'
import ExternalLinksSection from '../components/ExternalLinksSection'

function HomePage() {
  const location = useLocation()
  const { practices: officialPractices } = useOfficialPractices()

  // Featured = the most recently published Official Practice. The list is
  // ordered created_at desc and useOfficialPractices already filters to
  // published, so [0] is that practice -- no extra field or Featured CMS.
  // null while the list is still loading, or if there are none;
  // FeaturedPracticeSection renders nothing in that case.
  const featuredPractice = officialPractices[0] || null

  useEffect(() => {
    if (!location.hash) return

    const target = document.querySelector(location.hash)

    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }, [location])

  return (
    <>
      <HeroSection homepage={homepage} />

      <CoursesSection />

      <FeaturedPracticeSection practice={featuredPractice} />

      <PracticeFlowStrip title={homepage.practiceFlow.title} />

      <AboutSection teacher={teacher} />

      <ExternalLinksSection homepage={homepage} />
    </>
  )
}

export default HomePage
