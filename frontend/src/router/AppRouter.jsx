import { Routes, Route } from 'react-router-dom'

import HomePage from '../pages/HomePage'
import FoundationLibraryPage from '../pages/FoundationLibraryPage'
import FoundationPage from '../pages/FoundationPage'
import ModuleLibraryPage from '../pages/ModuleLibraryPage'
import ModulePage from '../pages/ModulePage'
import PracticePage from '../pages/PracticePage'

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
        path="/modules"
        element={<ModuleLibraryPage />}
      />

      <Route
        path="/modules/:slug"
        element={<ModulePage />}
      />

      <Route
        path="/practices/:slug"
        element={<PracticePage />}
      />
    </Routes>
  )
}

export default AppRouter