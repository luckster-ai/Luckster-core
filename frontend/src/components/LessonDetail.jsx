import { useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import { formatVideoDuration } from '../utils/formatDuration'
import { stripMarkdownSection, stripSectionIfEmpty } from '../utils/stripMarkdownSection'
import VideoPlayer from './VideoPlayer'

function toLessonContent(markdown) {
  let result = markdown.replace(/^#\s+.+\n+/, '')
  result = stripMarkdownSection(result, '##\\s*Basic Information')
  result = stripMarkdownSection(result, '##\\s*Summary')
  result = stripMarkdownSection(result, '##\\s*Tags')
  result = stripMarkdownSection(result, '###\\s*Video')
  result = stripSectionIfEmpty(result, '###\\s*Transcript')
  result = stripSectionIfEmpty(result, '###\\s*Resources')
  result = stripSectionIfEmpty(result, '##\\s*Sources')
  return result
}

function LessonDetail({ lesson, markdown }) {
  const playerRef = useRef(null)
  const lessonContent = toLessonContent(markdown)

  return (
    <>
      <h1>{lesson.chineseTitle}</h1>

      <p className="module-playback-subtitle">{lesson.title}</p>

      {lesson.videoReference?.videoId && (
        <div className="module-playback">
          <VideoPlayer
            ref={playerRef}
            provider={lesson.videoReference.provider}
            videoId={lesson.videoReference.videoId}
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

          <p>影片時長：{formatVideoDuration(lesson.duration)}</p>
        </div>
      )}

      <p>{lesson.summary}</p>

      <ReactMarkdown>{lessonContent}</ReactMarkdown>
    </>
  )
}

export default LessonDetail
