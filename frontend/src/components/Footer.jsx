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

        <a
          href="https://www.facebook.com/JotiLivdeepKaur"
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
      </nav>

      <p>© JOTI Kundalini Yoga</p>
    </footer>
  )
}

export default Footer
