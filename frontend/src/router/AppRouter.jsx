import { Routes, Route } from 'react-router-dom'

import HomePage from '../pages/HomePage'
import FoundationLibraryPage from '../pages/FoundationLibraryPage'
import FoundationPage from '../pages/FoundationPage'
import LessonPage from '../pages/LessonPage'
import ModuleLibraryPage from '../pages/ModuleLibraryPage'
import ModulePage from '../pages/ModulePage'
import PracticeHubPage from '../pages/PracticeHubPage'
import PracticeBuilderPage from '../pages/PracticeBuilderPage'
import PracticePage from '../pages/PracticePage'
import PracticePlayerPage from '../pages/PracticePlayerPage'

function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/foundations"
        element={<FoundationLibraryPage />}
      />

      <Route
        path="/foundations/:slug"
        element={<FoundationPage />}
      />

      <Route
        path="/foundations/:slug/:lessonSlug"
        element={<LessonPage />}
      />

      <Route
        path="/modules"
        element={<ModuleLibraryPage />}
      />

      <Route
        path="/modules/:slug"
        element={<ModulePage />}
      />

      <Route
        path="/practice"
        element={<PracticeHubPage />}
      />

      <Route
        path="/practice/build"
        element={<PracticeBuilderPage />}
      />

      <Route
        path="/practices/:slug"
        element={<PracticePage />}
      />

      <Route
        path="/practices/:slug/play"
        element={<PracticePlayerPage />}
      />
    </Routes>
  )
}

export default AppRouter