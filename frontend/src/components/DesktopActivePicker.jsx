import ModulePickerCanvas from './ModulePickerCanvas'

// Sprint 1D — Desktop-only. Renders below the six-column workbench,
// showing the real Picker (Category filter + Subcategory grouping +
// cross-section eligibility, all reused unchanged from
// ModulePickerCanvas -- no new selection/eligibility logic) for
// whichever single Section is currently active in the workbench.
// Hidden below 1024px via CSS (see .workbench-picker in App.css);
// Mobile/Tablet keep using the pre-existing Level 2 accordion below,
// untouched by this component.
function DesktopActivePicker({ activeSection, moduleIds, modules, allSelectedIds, moduleSectionLabels, onAdd, onClose }) {
  if (!activeSection) return null

  const zhLabel = activeSection.label.split(' ')[0]

  return (
    <div className="workbench-picker">
      <div className="workbench-picker-head">
        <h3>選擇 {zhLabel} 影片</h3>

        <button type="button" className="workbench-picker-close" onClick={onClose}>
          收起
        </button>
      </div>

      <ModulePickerCanvas
        category={activeSection.category}
        modules={modules}
        currentSectionIds={moduleIds}
        disabledIds={allSelectedIds}
        moduleSectionLabels={moduleSectionLabels}
        onAdd={onAdd}
      />
    </div>
  )
}

export default DesktopActivePicker
