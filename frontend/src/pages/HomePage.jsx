import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import homepage from '../data/homepage'
import teacher from '../data/teacher'
import { useOfficialPractices } from '../hooks/useOfficialPractices'

import HeroSection from '../components/HeroSection'
import WhyJotiSection from '../components/WhyJotiSection'
import CoursesSection from '../components/CoursesSection'
import PracticeFlowStrip from '../components/PracticeFlowStrip'
import FeaturedPracticeSection from '../components/FeaturedPracticeSection'
import AboutSection from '../components/AboutSection'
import SocialProofSection from '../components/SocialProofSection'
import FinalCtaSection from '../components/FinalCtaSection'

// Homepage Section Order Plan (2026-09), Option A -- ordered along the
// first-time visitor's decision path (understand the need → understand
// JOTI → understand the product → build trust → sign up / subscribe):
//   Hero → Why JOTI → 進入課程 (Courses) → Practice Flow → Featured
//   Practice → About / Founder → Social Proof (reserved, renders nothing
//   yet) → Final CTA.
// About/Founder now sits with Social Proof as the trust cluster, right
// before the Final CTA. Footer (關於 JOTI / YouTube / Facebook) is
// App.jsx's global layout, not rendered here.
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

      <WhyJotiSection />

      <CoursesSection />

      <PracticeFlowStrip title={homepage.practiceFlow.title} />

      <FeaturedPracticeSection practice={featuredPractice} />

      <AboutSection teacher={teacher} />

      <SocialProofSection />

      <FinalCtaSection />
    </>
  )
}

export default HomePage
