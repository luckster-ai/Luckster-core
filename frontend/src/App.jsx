import { useLocation } from 'react-router-dom'

import AppRouter from './router/AppRouter'
import Header from './components/Header'
import Footer from './components/Footer'

import './App.css'

function App() {
  const location = useLocation()
  const isPracticePlayback = location.pathname.endsWith('/play')

  return (
    <div className="app">
      {!isPracticePlayback && <Header />}

      <main>
        <AppRouter />
      </main>

      {!isPracticePlayback && <Footer />}
    </div>
  )
}

export default App
