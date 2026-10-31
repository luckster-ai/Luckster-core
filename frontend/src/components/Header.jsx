import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getMembershipStatus, MEMBERSHIP_STATUS } from '../utils/membershipStatus'

// Desktop: logo + positioning line on the left, nav on the right.
// Phones (≤768px): the nav collapses behind a menu button so the brand
// line stays on one row; the open menu is a simple list under the header.
function Header() {
  const { user, profile } = useAuth()
  const isAdmin = getMembershipStatus(profile) === MEMBERSHIP_STATUS.ADMIN
  const { pathname } = useLocation()
  // The positioning line next to the logo is shown on every member-facing
  // page; Admin pages keep the plain logo.
  const isAdminPage = pathname.startsWith('/admin')
  const [menu, setMenu] = useState({ open: false, pathname })

  // Close the menu whenever the route changes (e.g. after tapping a link).
  const menuOpen = menu.open && menu.pathname === pathname

  return (
    <header className={menuOpen ? 'header header--menu-open' : 'header'}>
      <div className="brand">
        <Link to="/" className="logo">
          JOTI
        </Link>
        {!isAdminPage && <span className="brand-tagline">昆達里尼 ABC 瑜伽</span>}
      </div>

      <button
        type="button"
        className="menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="site-nav"
        aria-label={menuOpen ? '關閉選單' : '開啟選單'}
        onClick={() => setMenu({ open: !menuOpen, pathname })}
      >
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
        <span className="menu-toggle-bar" />
      </button>

      <nav
        id="site-nav"
        className="site-nav"
        onClick={(event) => {
          // Also close when tapping the link of the page already shown.
          if (event.target.closest('a')) setMenu({ open: false, pathname })
        }}
      >
        <Link to="/about">關於 JOTI</Link>
        <Link to="/foundations">
          新手必修<span className="free-badge">免費</span>
        </Link>
        <Link to="/practice">完整練習</Link>
        <Link to="/pricing">付費會員</Link>
        {isAdmin && <Link to="/admin/practices">Admin</Link>}
        <Link to={user ? '/account' : '/login'}>{user ? '我的帳號' : '登入'}</Link>
      </nav>
    </header>
  )
}

export default Header
