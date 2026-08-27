import { Link } from 'react-router-dom'
import { useAuth } from '../state/useAuth'

function Header() {
  const { user } = useAuth()

  return (
    <header className="header">
      <Link to="/" className="logo">
        JOTI
      </Link>

      <nav>
        <Link to="/foundations">新手必修</Link>
        <Link to="/practice">開始練習</Link>
        <Link to="/about">關於 JOTI</Link>
        <Link to={user ? '/account' : '/login'}>{user ? '我的帳號' : '登入'}</Link>
      </nav>
    </header>
  )
}

export default Header
