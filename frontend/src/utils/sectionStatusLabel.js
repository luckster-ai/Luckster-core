// Shared with PracticeSectionCanvas.jsx (Tablet) and MobileModulePanel.jsx
// (Mobile) — both need the identical human-readable status text for a
// Section's validateSection() result. Kept as its own file (not
// PieceCard.jsx) because it's a plain function, not a component —
// combining component and non-component exports in one file breaks Fast
// Refresh (see react-refresh/only-export-components).
export function statusLabel(result) {
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
