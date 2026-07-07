function ModuleCard({ module }) {
  return (
    <div className="card">

      <h3>{module.title}</h3>

      <p>
        類別：{module.category}
      </p>

      <p>
        時長：{module.duration} 分鐘
      </p>

    </div>
  )
}

export default ModuleCard