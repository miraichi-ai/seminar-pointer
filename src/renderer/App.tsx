import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { DrawingTool, MarkerItem } from './types/drawing'
import { OverlayCanvas } from './components/OverlayCanvas'
import { Toolbar } from './components/Toolbar'
import { TextStampTool } from './components/TextStampTool'
import { useDrawing } from './hooks/useDrawing'
import { useShortcuts } from './hooks/useShortcuts'

const TEXT_PRESETS = ['①', '②', '③', 'ここ', '重要', 'OK', 'NG', '後で見る']
const COLORS = ['#ff2222', '#ff8800', '#ffdd00', '#22cc44', '#2266ff', '#cc22cc', '#ffffff', '#111111']
type PanelPosition = { x: number; y: number }

const getInitialToolbarPosition = (): PanelPosition => ({
  x: 16,
  y: Math.max(16, window.innerHeight - 112),
})

const getInitialTextPanelPosition = (): PanelPosition => ({
  x: 16,
  y: Math.max(16, window.innerHeight - 252),
})

export default function App() {
  const [isOverlayActive, setIsOverlayActive] = useState(false)
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('none')
  const [color, setColor] = useState('#ff2222')
  const [pendingText, setPendingText] = useState('①')
  const [markers, setMarkers] = useState<MarkerItem[]>([])
  const [toolbarPosition, setToolbarPosition] = useState<PanelPosition>(getInitialToolbarPosition)
  const [textPanelPosition, setTextPanelPosition] = useState<PanelPosition>(getInitialTextPanelPosition)
  const lastPointerRef = useRef<PanelPosition>({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  const { items, addItem, undoLast, clearAll: clearItems } = useDrawing()

  const clearAll = useCallback(() => {
    clearItems()
    setMarkers([])
  }, [clearItems])

  const undo = useCallback(() => {
    if (markers.length > 0) {
      setMarkers([])
      return
    }
    undoLast()
  }, [markers.length, undoLast])

  const deactivate = useCallback(() => {
    setIsOverlayActive(false)
    window.electronAPI.setClickThrough()
  }, [])

  const quitApp = useCallback(() => {
    window.electronAPI.quitApp()
  }, [])

  const handleAddMarker = useCallback(
    (x: number, y: number) => {
      const marker: MarkerItem = {
        id: `m-${Date.now()}`,
        type: 'marker',
        color: '#d98aa4',
        x,
        y,
        label: 'ここ見て！',
        durationMs: 1800,
        createdAt: Date.now(),
      }
      setMarkers([marker])
    },
    [color]
  )

  useShortcuts({
    isActive: isOverlayActive,
    onEscape: () => setSelectedTool('none'),
    onUndo: undo,
    onPulseMarker: () => handleAddMarker(lastPointerRef.current.x, lastPointerRef.current.y),
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
        onPointerMove={(x, y) => {
          lastPointerRef.current = { x, y }
        }}
      />
      <Toolbar
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
        onClearAll={clearAll}
        onClose={deactivate}
        onQuit={quitApp}
        color={color}
        onColorChange={setColor}
        colors={COLORS}
        position={toolbarPosition}
        onPositionChange={setToolbarPosition}
      />
      {selectedTool === 'text' && (
        <TextStampTool
          value={pendingText}
          onChange={setPendingText}
          presets={TEXT_PRESETS}
          position={textPanelPosition}
          onPositionChange={setTextPanelPosition}
        />
      )}
    </>
  )
}
