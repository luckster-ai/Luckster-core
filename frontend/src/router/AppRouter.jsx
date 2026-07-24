import { Routes, Route } from 'react-router-dom'

import HomePage from '../pages/HomePage'
import FoundationPage from '../pages/FoundationPage'
import ModuleLibraryPage from '../pages/ModuleLibraryPage'
import ModulePage from '../pages/ModulePage'

function AppRouter() {
  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
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
    </Routes>
  )
}

export default AppRouter