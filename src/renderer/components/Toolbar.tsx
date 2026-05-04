import React from 'react'
import type { DrawingTool } from '../types/drawing'

interface Props {
  selectedTool: DrawingTool
  onSelectTool: (tool: DrawingTool) => void
  onClearAll: () => void
  onClose: () => void
  onQuit: () => void
  color: string
  onColorChange: (color: string) => void
  colors: string[]
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
}

const TOOLS: Array<{ tool: DrawingTool; label: string; icon: string }> = [
  { tool: 'none',      label: '操作なし', icon: '↖' },
  { tool: 'rectangle', label: '四角',     icon: '▭' },
  { tool: 'circle',    label: '丸',       icon: '○' },
  { tool: 'line',      label: '線',       icon: '╱' },
  { tool: 'arrow',     label: '矢印',     icon: '→' },
  { tool: 'text',      label: 'テキスト', icon: 'T' },
  { tool: 'marker',    label: 'ここ見て', icon: '👆' },
  { tool: 'blur',      label: 'ぼかし',   icon: '▦' },
]

const DOCK_SAFE_BOTTOM = 190

export function Toolbar({
  selectedTool,
  onSelectTool,
  onClearAll,
  onClose,
  onQuit,
  color,
  onColorChange,
  colors,
  position,
  onPositionChange,
}: Props) {
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startPos = position

    const onMove = (moveEvent: MouseEvent) => {
      const nextX = Math.max(8, Math.min(window.innerWidth - 80, startPos.x + moveEvent.clientX - startX))
      const nextY = Math.max(8, Math.min(window.innerHeight - DOCK_SAFE_BOTTOM, startPos.y + moveEvent.clientY - startY))
      onPositionChange({ x: nextX, y: nextY })
    }

    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      className="toolbar"
      style={{ left: position.x, top: position.y }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="drag-handle" onMouseDown={startDrag} title="移動">
        ⋮⋮
      </div>
      <div className="toolbar-status" title="Seminar Pointer 起動中">
        起動中
      </div>
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

      <button className="toolbar-btn btn-danger" onClick={onQuit} title="完全終了">
        <span className="tb-icon">Q</span>
        <span className="tb-label">終了</span>
      </button>

      <div className="toolbar-hints">
        <span>⌘⇧S: 表示切替</span>
        <span>⌘⇧C: 全消去</span>
        <span>Ctrl×2: ここ見て</span>
        <span>Esc: 操作なし</span>
      </div>
    </div>
  )
}
