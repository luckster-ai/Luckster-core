import { useParams } from 'react-router-dom'
import foundations from '../data/foundations'

function FoundationPage() {
  const { slug } = useParams()

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

  return (
    <div className="foundation-page">
      <h1>{foundation.title}</h1>

      <p>
        <strong>Level：</strong>
        {foundation.level}
      </p>

      <p>
        <strong>Duration：</strong>
        {foundation.duration}
      </p>

      <p>{foundation.summary}</p>

      {foundation.youtube && (
        <p>
          <a
            href={foundation.youtube}
            target="_blank"
            rel="noreferrer"
          >
            前往 YouTube 觀看
          </a>
        </p>
      )}

      <p>
        <strong>完成狀態：</strong>
        {foundation.completed ? '✅ 已完成' : '⬜ 尚未完成'}
      </p>

      <hr />

      <p>
        這裡未來將自動載入 Markdown 課程內容。
      </p>
    </div>
  )
}

export default FoundationPage