import React, { useState, useEffect, useCallback } from 'react'
import type { DrawingTool, MarkerItem } from './types/drawing'
import { OverlayCanvas } from './components/OverlayCanvas'
import { Toolbar } from './components/Toolbar'
import { TextStampTool } from './components/TextStampTool'
import { useDrawing } from './hooks/useDrawing'
import { useShortcuts } from './hooks/useShortcuts'

const TEXT_PRESETS = ['①', '②', '③', 'ここ', '重要', 'OK', 'NG', '後で見る']
const COLORS = ['#ff2222', '#ff8800', '#ffdd00', '#22cc44', '#2266ff', '#cc22cc', '#ffffff', '#111111']

export default function App() {
  const [isOverlayActive, setIsOverlayActive] = useState(false)
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('rectangle')
  const [color, setColor] = useState('#ff2222')
  const [pendingText, setPendingText] = useState('①')
  const [markers, setMarkers] = useState<MarkerItem[]>([])
  const { items, addItem, clearAll: clearItems } = useDrawing()

  const clearAll = useCallback(() => {
    clearItems()
    setMarkers([])
  }, [clearItems])

  const deactivate = useCallback(() => {
    setIsOverlayActive(false)
    window.electronAPI.setClickThrough()
  }, [])

  useShortcuts({
    isActive: isOverlayActive,
    onEscape: () => setSelectedTool('rectangle'),
  })

  useEffect(() => {
    const unsubToggle = window.electronAPI.onToggleOverlay((visible: boolean) => {
      setIsOverlayActive(visible)
    })
    const unsubClear = window.electronAPI.onClearAll(() => {
      clearAll()
    })
    return () => {
      unsubToggle()
      unsubClear()
    }
  }, [clearAll])

  const handleAddMarker = useCallback(
    (x: number, y: number) => {
      const marker: MarkerItem = {
        id: `m-${Date.now()}`,
        type: 'marker',
        color,
        x,
        y,
        label: 'ここ見て！',
        durationMs: 3000,
        createdAt: Date.now(),
      }
      setMarkers(prev => [...prev, marker])
    },
    [color]
  )

  const handleExpireMarker = useCallback((id: string) => {
    setMarkers(prev => prev.filter(m => m.id !== id))
  }, [])

  if (!isOverlayActive) return null

  return (
    <>
      <OverlayCanvas
        isActive={isOverlayActive}
        selectedTool={selectedTool}
        color={color}
        strokeWidth={4}
        pendingText={pendingText}
        items={items}
        markers={markers}
        onAddItem={addItem}
        onAddMarker={handleAddMarker}
        onExpireMarker={handleExpireMarker}
      />
      <Toolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onClearAll={clearAll}
        onClose={deactivate}
        color={color}
        onColorChange={setColor}
        colors={COLORS}
      />
      {selectedTool === 'text' && (
        <TextStampTool
          value={pendingText}
          onChange={setPendingText}
          presets={TEXT_PRESETS}
        />
      )}
    </>
  )
}
