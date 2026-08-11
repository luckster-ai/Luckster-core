import ModulePicker from './ModulePicker'
import { formatVideoDuration } from '../utils/formatDuration'

function statusLabel(result) {
  if (result.count === 0) {
    return result.required ? '尚未加入（必要）' : '尚未加入（可省略）'
  }

  if (result.isValid) {
    return '已完成'
  }

  if (!result.meetsMax) {
    return `超過上限（最多 ${result.max} 部）`
  }

  return '未完成'
}

function PracticeBuilderSection({
  result,
  moduleIds,
  modules,
  allSelectedIds,
  capabilityNote,
  isExpanded,
  onToggle,
  onAdd,
  onRemove,
  onMove,
  relaxationPositionControl
}) {
  const sectionModules = moduleIds
    .map((id) => modules.find((module) => module.id === id))
    .filter(Boolean)

  return (
    <section className={`builder-section${isExpanded ? ' expanded' : ' collapsed'}${result.isValid ? ' valid' : ''}`}>
      <button type="button" className="builder-section-header" onClick={onToggle}>
        <span className="builder-section-title">
          {result.label}
          <span className="builder-section-tag">{result.required ? '必要' : '可選'}</span>
        </span>

        <span className="builder-section-summary">
          {result.count} 部
          {Number.isFinite(result.max) && result.max !== result.min ? `（限 ${result.min}–${result.max}）` : ''}
          {' · '}
          {statusLabel(result)}
        </span>
      </button>

      {isExpanded && (
        <div className="builder-section-body">
          <p className="builder-section-guidance">{result.guidance}</p>

          {capabilityNote && <p className="builder-section-capability-note">{capabilityNote}</p>}

          {relaxationPositionControl}

          {sectionModules.length > 0 && (
            <ol className="builder-selected-modules">
              {sectionModules.map((module, index) => (
                <li key={module.id}>
                  <span className="module-picker-title">{module.chineseTitle}</span>
                  <span className="module-picker-meta">{formatVideoDuration(module.duration)}</span>

                  <span className="builder-order-controls">
                    <button
                      type="button"
                      onClick={() => onMove(module.id, 'up')}
                      disabled={index === 0}
                      aria-label="上移"
                    >
                      ↑ 上移
                    </button>
                    <button
                      type="button"
                      onClick={() => onMove(module.id, 'down')}
                      disabled={index === sectionModules.length - 1}
                      aria-label="下移"
                    >
                      ↓ 下移
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(module.id)}
                      aria-label="移除"
                    >
                      移除
                    </button>
                  </span>
                </li>
              ))}
            </ol>
          )}

          {result.count < result.max && (
            <ModulePicker
              category={result.category}
              modules={modules}
              disabledIds={allSelectedIds}
              onAdd={onAdd}
            />
          )}
        </div>
      )}
    </section>
  )
}

export default PracticeBuilderSection
