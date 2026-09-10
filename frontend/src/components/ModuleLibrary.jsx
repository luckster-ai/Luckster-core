import ModuleCard from './ModuleCard'

function ModuleLibrary({ modules }) {
  return (
    <section className="modules">
      <h2>Module Library</h2>

      <p className="section-description">
        瀏覽組成 Practice 的所有 Module，了解每個練習階段的內容與時長。
      </p>

      <div className="cards">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} />
        ))}
      </div>
    </section>
  )
}

export default ModuleLibrary
