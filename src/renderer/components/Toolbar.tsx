import React from 'react'
import type { DrawingTool } from '../types/drawing'

interface Props {
  selectedTool: DrawingTool
  onSelectTool: (tool: DrawingTool) => void
  onClearAll: () => void
  onClose: () => void
  color: string
  onColorChange: (color: string) => void
  colors: string[]
}

const TOOLS: Array<{ tool: DrawingTool; label: string; icon: string }> = [
  { tool: 'rectangle', label: '四角',     icon: '▭' },
  { tool: 'circle',    label: '丸',       icon: '○' },
  { tool: 'line',      label: '線',       icon: '╱' },
  { tool: 'arrow',     label: '矢印',     icon: '→' },
  { tool: 'text',      label: 'テキスト', icon: 'T' },
  { tool: 'marker',    label: 'ここ見て', icon: '👆' },
]

export function Toolbar({
  selectedTool,
  onSelectTool,
  onClearAll,
  onClose,
  color,
  onColorChange,
  colors,
}: Props) {
  return (
    <div className="toolbar" onMouseDown={e => e.stopPropagation()}>
      {TOOLS.map(({ tool, label, icon }) => (
        <button
          key={tool}
          className={`toolbar-btn ${selectedTool === tool ? 'active' : ''}`}
          onClick={() => onSelectTool(tool)}
          title={label}
        >
          <span className="tb-icon">{icon}</span>
          <span className="tb-label">{label}</span>
        </button>
      ))}

      <div className="toolbar-divider" />

      <div className="color-picker">
        {colors.map(c => (
          <button
            key={c}
            className={`color-btn ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
            title={c}
          />
        ))}
      </div>

      <div className="toolbar-divider" />

      <button className="toolbar-btn btn-danger" onClick={onClearAll} title="全消去 (⌘⇧C)">
        <span className="tb-icon">🗑</span>
        <span className="tb-label">全消去</span>
      </button>

      <button className="toolbar-btn btn-close" onClick={onClose} title="閉じる (⌘⇧S)">
        <span className="tb-icon">✕</span>
        <span className="tb-label">閉じる</span>
      </button>

      <div className="toolbar-hints">
        <span>⌘⇧S: 表示切替</span>
        <span>⌘⇧C: 全消去</span>
        <span>Esc: モード解除</span>
      </div>
    </div>
  )
}
