import { Link } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus, MEMBERSHIP_STATUS } from '../utils/membershipStatus'

function Header() {
  const { user, profile } = useAuth()
  const isAdmin = getMembershipStatus(profile) === MEMBERSHIP_STATUS.ADMIN

  return (
    <header className="header">
      <Link to="/" className="logo">
        JOTI
      </Link>

      <nav>
        <Link to="/foundations">新手必修</Link>
        <Link to="/practice">開始練習</Link>
        <Link to="/about">關於 JOTI</Link>
        {isAdmin && <Link to="/admin/practices">Admin</Link>}
        <Link to={user ? '/account' : '/login'}>{user ? '我的帳號' : '登入'}</Link>
      </nav>
    </header>
  )
}

export default Header
