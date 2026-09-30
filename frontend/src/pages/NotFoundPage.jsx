import { Link } from 'react-router-dom'

// Production Publication Polish (2026-09): catch-all route for any
// unmatched path. Previously there was none -- an unmatched URL rendered
// Header + Footer around a completely empty <main>, with no indication
// anything had gone wrong.
function NotFoundPage() {
  return (
    <div className="auth-page">
      <h1>找不到這個頁面</h1>
      <p>你要找的網址不存在，或已經移動位置。</p>

      <Link to="/" className="button">
        回到首頁
      </Link>
    </div>
  )
}

export default NotFoundPage
