import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import homepage from '../data/homepage'
import teacher from '../data/teacher'
import practices from '../data/practices'
import { isPublished } from '../utils/practiceLifecycle'

import HeroSection from '../components/HeroSection'
import CoursesSection from '../components/CoursesSection'
import FeaturedPracticeSection from '../components/FeaturedPracticeSection'
import PracticeFlowStrip from '../components/PracticeFlowStrip'
import AboutSection from '../components/AboutSection'
import ExternalLinksSection from '../components/ExternalLinksSection'

function HomePage() {
  const location = useLocation()

  // Was `practices[0]` -- broke silently the moment a second official
  // Practice existed (always showed the array's first entry regardless
  // of intent) and had no way to keep an in-progress Practice out of the
  // spotlight. `.find` picks the first *published* entry instead, so
  // adding more official Practices (or drafting one) can't change which
  // one Home features without an explicit status change.
  const featuredPractice = practices.find(isPublished) || null

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
