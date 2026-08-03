import { formatVideoDuration } from '../utils/formatDuration'

function ModuleCard({ module }) {
  return (
    <div className="card">

      <h3>{module.title}</h3>

      <p>
        類別：{module.category}
      </p>

      <p>
        影片時長：{formatVideoDuration(module.duration)}
      </p>

    </div>
  )
}

export default ModuleCard