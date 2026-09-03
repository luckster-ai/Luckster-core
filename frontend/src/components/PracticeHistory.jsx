import { Link } from 'react-router-dom'
import { resolvePracticeById, resolveModuleTitles, groupSessionsByDay } from '../utils/practiceHistory'

// Practice History (Phase 5D). Deliberately not PracticeCard.jsx --
// that component assumes a full, resolvable Practice object (`.slug`,
// resolvePracticeModules(), etc.), but a History row may only have a
// practice_id that no longer resolves to anything on this device (a
// Custom Practice practiced elsewhere, or a hypothetical removed
// Official Practice) -- see resolvePracticeById()'s own comment. This
// component is the one place that has to handle both outcomes.
//
// No elapsed-time display here on purpose -- completed_at - started_at
// would look like "how long you practiced," which is a different,
// already-answered question (Phase 4D's actual Bunny watch-time
// tracking); showing a second, unrelated number with a similar meaning
// here would just be confusing, not informative.
function PracticeHistory({ sessions, officialById, loading }) {
  if (loading) return null

  if (sessions.length === 0) {
    return (
      <section className="practice-history">
        <h2>練習歷史</h2>
        <p>還沒有練習紀錄，開始一堂 Practice 後會顯示在這裡。</p>
      </section>
    )
  }

  const days = groupSessionsByDay(sessions)

  return (
    <section className="practice-history">
      <h2>練習歷史</h2>

      {days.map(({ day, sessions: daySessions }) => (
        <div key={day} className="practice-history-day">
          <h3>{day}</h3>

          <ul className="practice-history-list">
            {daySessions.map((session) => {
              const practice = resolvePracticeById(session.practice_id, officialById)
              const time = new Date(session.started_at).toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit'
              })
              const status = session.completed_at ? '已完成' : '未完成'

              return (
                <li key={session.id} className="practice-history-session">
                  <span className="practice-history-time">{time}</span>

                  {practice ? (
                    <Link to={`/practices/${practice.slug}`}>{practice.chineseTitle}</Link>
                  ) : (
                    <span>
                      {resolveModuleTitles(session.module_ids).join('、') || '（此 Practice 內容目前無法顯示）'}
                      <br />
                      <small>此 Practice 目前只存在建立時的裝置，無法在這裡開啟。</small>
                    </span>
                  )}

                  <span className="practice-history-status">{status}</span>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}

export default PracticeHistory
