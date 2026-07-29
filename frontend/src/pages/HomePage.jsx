import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import homepage from '../data/homepage'
import teacher from '../data/teacher'

import HeroSection from '../components/HeroSection'
import CoursesSection from '../components/CoursesSection'
import AboutSection from '../components/AboutSection'
import ExternalLinksSection from '../components/ExternalLinksSection'

function HomePage() {
  const location = useLocation()

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

      <AboutSection teacher={teacher} />

      <ExternalLinksSection homepage={homepage} />
    </>
  )
}

export default HomePage
