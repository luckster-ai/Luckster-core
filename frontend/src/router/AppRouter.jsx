import { Routes, Route } from 'react-router-dom'

import HomePage from '../pages/HomePage'
import FoundationPage from '../pages/FoundationPage'

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
    </Routes>
  )
}

export default AppRouter