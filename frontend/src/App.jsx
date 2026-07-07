import AppRouter from './router/AppRouter'

import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          JOTI
        </div>

        <nav>
          <a href="/">首頁</a>
          <a href="#">免費課程</a>
          <a href="#">YouTube</a>
          <a href="#">關於我</a>
        </nav>
      </header>

      <main>
        <AppRouter />
      </main>

      <footer>
        © JOTI Kundalini Yoga
        <p>Practice • Grow • Transform</p>
      </footer>
    </div>
  )
}

export default App