import { Link } from 'react-router-dom'
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
          <Link
            key={module.id}
            to={`/modules/${module.slug}`}
            className="card-link"
          >
            <ModuleCard module={module} />
          </Link>
        ))}
      </div>
    </section>
  )
}

export default ModuleLibrary
