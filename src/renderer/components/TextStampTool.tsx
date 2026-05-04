import React from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  presets: string[]
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
}

export function TextStampTool({ value, onChange, presets, position, onPositionChange }: Props) {
  const startDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startPos = position

    const onMove = (moveEvent: MouseEvent) => {
      const nextX = Math.max(8, Math.min(window.innerWidth - 240, startPos.x + moveEvent.clientX - startX))
      const nextY = Math.max(8, Math.min(window.innerHeight - 88, startPos.y + moveEvent.clientY - startY))
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
      className="text-stamp-panel"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-panel-title" onMouseDown={startDrag}>
        <span className="drag-handle">⋮⋮</span>
        <span>テキスト</span>
      </div>
      <div className="text-stamp-top">
        <label className="text-stamp-label">スタンプ文字：</label>
        <textarea
          className="text-stamp-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="テキストを入力"
          autoFocus
          rows={3}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        />
      </div>
      <div className="preset-list">
        {presets.map(preset => (
          <button
            key={preset}
            className={`preset-btn ${value === preset ? 'active' : ''}`}
            onClick={() => onChange(preset)}
            onMouseDown={e => e.stopPropagation()}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  )
}
