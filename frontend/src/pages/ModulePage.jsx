import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import modules from '../data/modules'
import { formatVideoDuration } from '../utils/formatDuration'
import VideoPlayer from '../components/VideoPlayer'

const markdownModules = import.meta.glob(
  '../content/modules/*.md',
  {
    query: '?raw',
    import: 'default',
    eager: true
  }
)

function ModulePage() {
  const { slug } = useParams()

  const module = modules.find(
    (item) => item.slug === slug
  )

  if (!module) {
    return (
      <div className="module-page">
        <h1>找不到課程</h1>
        <p>此 Module 不存在。</p>
      </div>
    )
  }

  const markdownPath = `../content/modules/${slug}.md`
  const markdown = markdownModules[markdownPath] || ''

  return (
    <div className="module-page">
      <h1>{module.title}</h1>

      <p>
        <strong>難度：</strong> {module.difficulty}
      </p>

      <p>
        <strong>影片時長：</strong> {formatVideoDuration(module.duration)}
      </p>

      <p>{module.summary}</p>

      {module.videoReference?.provider === 'youtube' && module.videoReference?.videoId && (
        <p>
          <a
            href={`https://www.youtube.com/watch?v=${module.videoReference.videoId}`}
            target="_blank"
            rel="noreferrer"
          >
            前往 YouTube 觀看
          </a>
        </p>
      )}

      {/* Bunny (2026-08-25): standalone playback via the same
          provider-agnostic VideoPlayer LessonDetail.jsx already uses for
          Foundation lessons -- no custom Fullscreen button (matches the
          native-controls-only decision made for VideoModule.jsx), and
          onEnded is a required prop on the imperative handle (both
          Engines call it unconditionally when playback ends), so it must
          be passed even though this standalone view has nothing to
          advance to. */}
      {module.videoReference?.provider === 'bunny' && module.videoReference?.videoId && (
        <VideoPlayer
          provider="bunny"
          videoId={module.videoReference.videoId}
          onEnded={() => {}}
        />
      )}

      <hr />

      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  )
}

export default ModulePage
