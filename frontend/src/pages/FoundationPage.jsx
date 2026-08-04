import { useRef } from 'react'
import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import foundations from '../data/foundations'
import { formatVideoDuration } from '../utils/formatDuration'
import VideoPlayer from '../components/VideoPlayer'

const markdownModules = import.meta.glob(
  '../content/foundations/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

function toLessonContent(markdown) {
  return markdown
    .replace(/^#\s+.+\n+/, '')
    .replace(/##\s*Basic Information[\s\S]*?\n---\n+/, '')
    .replace(/###\s*Video[\s\S]*?(?=\n###|\n---|\s*$)/, '')
}

function FoundationPage() {
  const { slug } = useParams()
  const playerRef = useRef(null)

  const foundation = foundations.find(
    (item) => item.slug === slug
  )

  if (!foundation) {
    return (
      <div className="foundation-page">
        <h1>找不到課程</h1>
        <p>此 Foundation 不存在。</p>
      </div>
    )
  }

  const markdownPath = `../content/foundations/${slug}.md`
  const markdown = markdownModules[markdownPath] || ''
  const lessonContent = toLessonContent(markdown)

  return (
    <div className="foundation-page">
      <h1>{foundation.chineseTitle}</h1>

      <p className="module-playback-subtitle">{foundation.title}</p>

      {foundation.videoReference?.videoId && (
        <div className="module-playback">
          <VideoPlayer
            ref={playerRef}
            videoId={foundation.videoReference.videoId}
            onEnded={() => {}}
          />

          <div className="playback-controls">
            <button onClick={() => playerRef.current?.play()}>
              播放
            </button>

            <button onClick={() => playerRef.current?.pause()}>
              暫停
            </button>
          </div>

          <p>影片時長：{formatVideoDuration(foundation.duration)}</p>
        </div>
      )}

      <p>{foundation.summary}</p>

      <ReactMarkdown>{lessonContent}</ReactMarkdown>
    </div>
  )
}

export default FoundationPage