import { useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import foundations from '../data/foundations'
import { formatVideoDuration } from '../utils/formatDuration'
import { getMarkdownSection } from '../utils/stripMarkdownSection'
import VideoPlayer from './VideoPlayer'
import { useLearnerStatus } from '../hooks/useLearnerStatus'
import { LEARNER_STATUS } from '../utils/learnerStatus'

// Foundation video page (single-lesson Foundations and lessons opened
// from a multi-lesson page). Order: Chinese title → English title →
// 建議先完成 → video (+ 影片時長 in the card format) → notes. The notes are
// the markdown's Description and Learning Outcomes as two bullet points,
// without their English headings; the Summary is left out because the
// card on the previous page already shows it.

// 建議先完成 (prerequisites) come from the markdown's Prerequisites section (the authored
// content; lesson.prerequisites in data/foundations.js misses some), as
// ids like FD001 / FD005-L04 shown by Chinese title and linked. A
// single-lesson Foundation links to its own page; an id that is also a
// lesson of a multi-lesson Foundation (e.g. FD008) links to that lesson.
function resolvePrerequisite(id) {
  for (const foundation of foundations) {
    const lesson = foundation.lessons.find((item) => item.id === id)
    if (foundation.id === id && (foundation.lessons.length === 1 || !lesson)) {
      return { id, title: foundation.chineseTitle, to: `/foundations/${foundation.slug}` }
    }
    if (lesson) {
      return { id, title: lesson.chineseTitle, to: `/foundations/${foundation.slug}/${lesson.slug}` }
    }
  }
  return null
}

function getPrerequisiteIds(markdown, lesson) {
  const ids = getMarkdownSection(markdown, 'Prerequisites').match(/FD\d{3}(?:-L\d{2})?/g)
  return ids || lesson.prerequisites || []
}

// Back link above the title. A lesson of a multi-lesson Foundation
// (`parent`) links back to that page on every device. A single-lesson
// Foundation page shows 返回新手必修列表 on phones only -- on desktop the
// header's 新手必修 link is always visible.
// Opened from a Practice page's 建議先完成 (PracticePage.jsx passes the
// Practice slug in the link's location state), it shows 返回練習 instead,
// on every device; other entry points keep the links above.
function LessonBackLink({ parent }) {
  const fromPractice = useLocation().state?.fromPractice

  if (fromPractice) {
    return (
      <Link to={`/practices/${fromPractice}`} className="practice-player-exit">
        ← 返回練習
      </Link>
    )
  }

  if (parent) {
    return (
      <Link to={`/foundations/${parent.slug}`} className="practice-player-exit">
        ← 返回{parent.chineseTitle}
        <span className="back-label-mobile">列表</span>
      </Link>
    )
  }

  return (
    <Link to="/foundations" className="practice-player-exit back-mobile-only">
      ← 返回新手必修列表
    </Link>
  )
}

function LessonDetail({ lesson, markdown, parent }) {
  const playerRef = useRef(null)
  const notes = [getMarkdownSection(markdown, 'Description'), getMarkdownSection(markdown, 'Learning Outcomes')]
    .filter(Boolean)
  const prerequisites = getPrerequisiteIds(markdown, lesson).map(resolvePrerequisite).filter(Boolean)
  const { isLoggedIn, learnerStatusMap, markCompleted } = useLearnerStatus()

  // Phase 3 (Learning Data): 'already_learned' isn't offered as a
  // choice from this button yet (see the Phase 3 analysis) -- it still
  // counts as done here in case a future admin/import path ever sets it
  // directly, so this stays consistent with isPrerequisiteSatisfied.
  const lessonStatus = learnerStatusMap[lesson.id]
  const isLessonComplete =
    lessonStatus === LEARNER_STATUS.COMPLETED || lessonStatus === LEARNER_STATUS.ALREADY_LEARNED

  return (
    <>
      <LessonBackLink parent={parent} />

      <h1 className="foundation-page-title">{lesson.chineseTitle}</h1>

      <p className="module-playback-subtitle">{lesson.title}</p>

      <p className="lesson-prerequisites">
        建議先完成：
        {prerequisites.length === 0
          ? '無'
          : prerequisites.map((item, index) => (
              <span key={item.id}>
                {index > 0 && '、'}
                <Link to={item.to}>{item.title}</Link>
              </span>
            ))}
      </p>

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

          <p className="card-duration">影片時長：{formatVideoDuration(lesson.duration)}</p>
        </div>
      )}

      {isLoggedIn && (
        <p className="learning-status">
          {isLessonComplete ? (
            '✓ 已完成'
          ) : (
            <button
              type="button"
              className="button secondary"
              onClick={() => markCompleted('lesson', lesson.id)}
            >
              標記完成
            </button>
          )}
        </p>
      )}

      {notes.length > 0 && (
        <ul className="lesson-notes">
          {notes.map((note) => (
            <li key={note}>
              <ReactMarkdown>{note}</ReactMarkdown>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export default LessonDetail
