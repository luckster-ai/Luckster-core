import { Link } from 'react-router-dom'
import homepage from '../data/homepage'

function Footer() {
  return (
    <footer>
      <nav>
        <Link to="/about">關於 JOTI</Link>

        <a
          href={homepage.youtube.channelUrl}
          target="_blank"
          rel="noreferrer"
        >
          YouTube
        </a>

        <span className="link-placeholder">Facebook</span>
      </nav>

      <p>© JOTI Kundalini Yoga</p>
    </footer>
  )
}

export default Footer
