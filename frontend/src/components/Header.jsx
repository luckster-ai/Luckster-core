import { Link } from 'react-router-dom'

function Header() {
  return (
    <header className="header">
      <Link to="/" className="logo">
        JOTI
      </Link>

      <nav>
        <Link to="/foundations">新手必修</Link>
        <Link to="/practice">開始練習</Link>
        <Link to="/about">關於 JOTI</Link>
      </nav>
    </header>
  )
}

export default Header
