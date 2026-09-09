import { Routes, Route } from 'react-router-dom'

import HomePage from '../pages/HomePage'
import AboutPage from '../pages/AboutPage'
import FoundationLibraryPage from '../pages/FoundationLibraryPage'
import FoundationPage from '../pages/FoundationPage'
import LessonPage from '../pages/LessonPage'
import ModuleLibraryPage from '../pages/ModuleLibraryPage'
import ModulePage from '../pages/ModulePage'
import PracticeHubPage from '../pages/PracticeHubPage'
import PracticeBuilderPage from '../pages/PracticeBuilderPage'
import PracticePage from '../pages/PracticePage'
import PracticePlayerPage from '../pages/PracticePlayerPage'
import LoginPage from '../pages/LoginPage'
import AccountPage from '../pages/AccountPage'
import AuthCallbackPage from '../pages/AuthCallbackPage'
import SubscribePage from '../pages/SubscribePage'
import AdminPracticeListPage from '../pages/AdminPracticeListPage'
import AdminPracticeEditPage from '../pages/AdminPracticeEditPage'

// Payment Phase 1 -- Oen TEST first-subscription MVP. /subscribe is
// enabled ONLY when VITE_ENABLE_SUBSCRIBE === 'true', which is set only on
// the Vercel Preview deployment (A4). Every other environment (local,
// production `main`) leaves it unset, so the route is not registered at
// all and the page is unreachable.
const SUBSCRIBE_ENABLED = import.meta.env.VITE_ENABLE_SUBSCRIBE === 'true'

function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/about"
        element={<AboutPage />}
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

      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/account"
        element={<AccountPage />}
      />

      <Route
        path="/auth/callback"
        element={<AuthCallbackPage />}
      />

      <Route
        path="/admin/practices"
        element={<AdminPracticeListPage />}
      />

      <Route
        path="/admin/practices/new"
        element={<AdminPracticeEditPage />}
      />

      <Route
        path="/admin/practices/:id/edit"
        element={<AdminPracticeEditPage />}
      />

      {SUBSCRIBE_ENABLED && (
        <Route
          path="/subscribe"
          element={<SubscribePage />}
        />
      )}
    </Routes>
  )
}

export default AppRouter