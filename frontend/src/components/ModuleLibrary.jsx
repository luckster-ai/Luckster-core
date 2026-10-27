import ModuleCard from './ModuleCard'

function ModuleLibrary({ modules }) {
  return (
    <section className="modules">
      <h2>練習單元</h2>

      <p className="section-description">
        瀏覽組成練習的所有練習單元，了解每個練習階段的內容與時長。
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
