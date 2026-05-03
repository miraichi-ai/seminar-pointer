import React from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  presets: string[]
}

export function TextStampTool({ value, onChange, presets }: Props) {
  return (
    <div className="text-stamp-panel">
      <div className="text-stamp-top">
        <label className="text-stamp-label">スタンプ文字：</label>
        <input
          type="text"
          className="text-stamp-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="テキストを入力"
          autoFocus
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
