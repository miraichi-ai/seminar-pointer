import React, { useRef, useEffect, useState, useCallback } from 'react'
import type {
  DrawingTool,
  DrawingItem,
  RectangleItem,
  CircleItem,
  LineItem,
  ArrowItem,
  TextItem,
  MarkerItem,
  BlurItem,
} from '../types/drawing'
import { drawItem } from '../utils/drawingUtils'
import { KokoMiteMarker } from './KokoMiteMarker'
import { ScreenBlurRegions } from './ScreenBlurRegions'

interface Props {
  isActive: boolean
  selectedTool: DrawingTool
  color: string
  strokeWidth: number
  pendingText: string
  items: DrawingItem[]
  markers: MarkerItem[]
  onAddItem: (item: DrawingItem) => void
  onUpdateItem: (id: string, updater: (item: DrawingItem) => DrawingItem) => void
  onAddMarker: (x: number, y: number) => void
  onExpireMarker: (id: string) => void
  onPointerMove: (x: number, y: number) => void
}

type Point = { x: number; y: number }
type HandleId = 'nw' | 'ne' | 'sw' | 'se' | 'start' | 'end'
type ActiveDrag =
  | { mode: 'move'; id: string; pointer: Point; item: DrawingItem }
  | { mode: 'resize'; id: string; pointer: Point; item: DrawingItem; handle: HandleId }

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function normalizeRect(item: RectangleItem | BlurItem): { x: number; y: number; width: number; height: number } {
  return {
    x: item.width < 0 ? item.x + item.width : item.x,
    y: item.height < 0 ? item.y + item.height : item.y,
    width: Math.abs(item.width),
    height: Math.abs(item.height),
  }
}

function distanceToSegment(pt: Point, start: Point, end: Point): number {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSq = dx * dx + dy * dy
  if (lengthSq === 0) return Math.hypot(pt.x - start.x, pt.y - start.y)
  const t = Math.max(0, Math.min(1, ((pt.x - start.x) * dx + (pt.y - start.y) * dy) / lengthSq))
  return Math.hypot(pt.x - (start.x + t * dx), pt.y - (start.y + t * dy))
}

function isPointOnItem(pt: Point, item: DrawingItem, selectedTool: DrawingTool): boolean {
  if (item.type !== selectedTool) return false
  const tolerance = 12

  switch (item.type) {
    case 'rectangle': {
      const rect = normalizeRect(item)
      return pt.x >= rect.x - tolerance && pt.x <= rect.x + rect.width + tolerance && pt.y >= rect.y - tolerance && pt.y <= rect.y + rect.height + tolerance
    }
    case 'circle': {
      if (item.radiusX <= 0 || item.radiusY <= 0) return false
      const normalized = ((pt.x - item.x) ** 2) / (item.radiusX ** 2) + ((pt.y - item.y) ** 2) / (item.radiusY ** 2)
      return normalized <= 1.18
    }
    case 'line':
    case 'arrow':
      return distanceToSegment(pt, { x: item.startX, y: item.startY }, { x: item.endX, y: item.endY }) <= tolerance
    case 'blur': {
      const rect = normalizeRect(item)
      return pt.x >= rect.x && pt.x <= rect.x + rect.width && pt.y >= rect.y && pt.y <= rect.y + rect.height
    }
    case 'text': {
      const lines = item.text.split(/\r?\n/)
      const width = Math.max(...lines.map(line => line.length), 1) * item.fontSize * 0.64
      const height = lines.length * item.fontSize * 1.25
      return pt.x >= item.x - tolerance && pt.x <= item.x + width + tolerance && pt.y >= item.y - tolerance && pt.y <= item.y + height + tolerance
    }
    case 'marker':
      return false
  }
}

function getItemBounds(item: DrawingItem): { x: number; y: number; width: number; height: number } | null {
  switch (item.type) {
    case 'rectangle':
    case 'blur':
      return normalizeRect(item)
    case 'circle':
      return { x: item.x - item.radiusX, y: item.y - item.radiusY, width: item.radiusX * 2, height: item.radiusY * 2 }
    case 'line':
    case 'arrow': {
      const x = Math.min(item.startX, item.endX)
      const y = Math.min(item.startY, item.endY)
      return { x, y, width: Math.abs(item.endX - item.startX), height: Math.abs(item.endY - item.startY) }
    }
    case 'text': {
      const lines = item.text.split(/\r?\n/)
      return {
        x: item.x,
        y: item.y,
        width: Math.max(...lines.map(line => line.length), 1) * item.fontSize * 0.64,
        height: lines.length * item.fontSize * 1.25,
      }
    }
    case 'marker':
      return null
  }
}

function getResizeHandles(item: DrawingItem): Array<{ id: HandleId; x: number; y: number }> {
  if (item.type === 'line' || item.type === 'arrow') {
    return [
      { id: 'start', x: item.startX, y: item.startY },
      { id: 'end', x: item.endX, y: item.endY },
    ]
  }

  const bounds = getItemBounds(item)
  if (!bounds || item.type === 'marker') return []
  return [
    { id: 'nw', x: bounds.x, y: bounds.y },
    { id: 'ne', x: bounds.x + bounds.width, y: bounds.y },
    { id: 'sw', x: bounds.x, y: bounds.y + bounds.height },
    { id: 'se', x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ]
}

function findResizeHandle(pt: Point, item: DrawingItem): HandleId | null {
  const size = 10
  return getResizeHandles(item).find(handle => (
    pt.x >= handle.x - size &&
    pt.x <= handle.x + size &&
    pt.y >= handle.y - size &&
    pt.y <= handle.y + size
  ))?.id ?? null
}

function drawSelectionHandles(ctx: CanvasRenderingContext2D, item: DrawingItem): void {
  const bounds = getItemBounds(item)
  if (!bounds) return

  ctx.save()
  ctx.setLineDash([5, 5])
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.82)'
  ctx.lineWidth = 1.5
  ctx.shadowColor = 'rgba(0,0,0,0.45)'
  ctx.shadowBlur = 3

  if (item.type !== 'line' && item.type !== 'arrow') {
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height)
  }

  ctx.setLineDash([])
  getResizeHandles(item).forEach(handle => {
    ctx.beginPath()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)'
    ctx.strokeStyle = 'rgba(44, 31, 38, 0.72)'
    ctx.roundRect(handle.x - 5, handle.y - 5, 10, 10, 3)
    ctx.fill()
    ctx.stroke()
  })
  ctx.restore()
}

function moveItem(item: DrawingItem, dx: number, dy: number): DrawingItem {
  switch (item.type) {
    case 'rectangle':
    case 'blur':
    case 'text':
    case 'circle':
      return { ...item, x: item.x + dx, y: item.y + dy }
    case 'line':
    case 'arrow':
      return { ...item, startX: item.startX + dx, startY: item.startY + dy, endX: item.endX + dx, endY: item.endY + dy }
    case 'marker':
      return item
  }
}

function resizeItem(item: DrawingItem, handle: HandleId, dx: number, dy: number): DrawingItem {
  switch (item.type) {
    case 'rectangle': {
      const left = item.x
      const top = item.y
      const right = item.x + item.width
      const bottom = item.y + item.height
      const nextLeft = handle === 'nw' || handle === 'sw' ? left + dx : left
      const nextTop = handle === 'nw' || handle === 'ne' ? top + dy : top
      const nextRight = handle === 'ne' || handle === 'se' ? right + dx : right
      const nextBottom = handle === 'sw' || handle === 'se' ? bottom + dy : bottom
      return { ...item, x: nextLeft, y: nextTop, width: nextRight - nextLeft, height: nextBottom - nextTop }
    }
    case 'blur': {
      const left = item.x
      const top = item.y
      const right = item.x + item.width
      const bottom = item.y + item.height
      const nextLeft = handle === 'nw' || handle === 'sw' ? left + dx : left
      const nextTop = handle === 'nw' || handle === 'ne' ? top + dy : top
      const nextRight = handle === 'ne' || handle === 'se' ? right + dx : right
      const nextBottom = handle === 'sw' || handle === 'se' ? bottom + dy : bottom
      return { ...item, x: nextLeft, y: nextTop, width: nextRight - nextLeft, height: nextBottom - nextTop }
    }
    case 'circle': {
      const horizontal = handle === 'nw' || handle === 'sw' ? -dx : dx
      const vertical = handle === 'nw' || handle === 'ne' ? -dy : dy
      return { ...item, radiusX: Math.max(4, item.radiusX + horizontal), radiusY: Math.max(4, item.radiusY + vertical) }
    }
    case 'line':
    case 'arrow':
      if (handle === 'start') return { ...item, startX: item.startX + dx, startY: item.startY + dy }
      if (handle === 'end') return { ...item, endX: item.endX + dx, endY: item.endY + dy }
      return item
    case 'text': {
      const amount = Math.abs(dx) > Math.abs(dy) ? dx : dy
      return { ...item, fontSize: Math.max(12, Math.min(96, item.fontSize + amount / 4)) }
    }
    case 'marker':
      return item
  }
}

export function OverlayCanvas({
  isActive,
  selectedTool,
  color,
  strokeWidth,
  pendingText,
  items,
  markers,
  onAddItem,
  onUpdateItem,
  onAddMarker,
  onExpireMarker,
  onPointerMove,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const startPt = useRef<Point | null>(null)
  const activeDrag = useRef<ActiveDrag | null>(null)
  const dprRef = useRef(1)

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [])

  const redraw = useCallback(
    (previewItem?: DrawingItem) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = dprRef.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      items.filter(item => item.type !== 'blur').forEach(item => drawItem(ctx, item))
      if (previewItem) drawItem(ctx, previewItem)
      const selectedItem = items.find(item => item.id === selectedItemId)
      if (selectedItem) drawSelectionHandles(ctx, selectedItem)
    },
    [items, selectedItemId]
  )

  useEffect(() => {
    setupCanvas()
    redraw()
    const onResize = () => {
      setupCanvas()
      requestAnimationFrame(() => redraw())
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [setupCanvas, redraw])

  useEffect(() => {
    redraw()
  }, [redraw])

  const getPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point => ({
    x: e.clientX,
    y: e.clientY,
  })

  const buildPreview = (start: Point, end: Point): DrawingItem | null => {
    const base = { id: makeId(), color, strokeWidth, createdAt: Date.now() }
    switch (selectedTool) {
      case 'rectangle':
        return { ...base, type: 'rectangle', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y } as RectangleItem
      case 'circle':
        return { ...base, type: 'circle', x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, radiusX: Math.abs(end.x - start.x) / 2, radiusY: Math.abs(end.y - start.y) / 2 } as CircleItem
      case 'line':
        return { ...base, type: 'line', startX: start.x, startY: start.y, endX: end.x, endY: end.y } as LineItem
      case 'arrow':
        return { ...base, type: 'arrow', startX: start.x, startY: start.y, endX: end.x, endY: end.y } as ArrowItem
      case 'blur':
        return { ...base, type: 'blur', x: start.x, y: start.y, width: end.x - start.x, height: end.y - start.y, blurPx: 12 } as BlurItem
      default:
        return null
    }
  }

  const findMovableItemAtPoint = (pt: Point): DrawingItem | null => {
    for (let i = items.length - 1; i >= 0; i -= 1) {
      const item = items[i]
      if (isPointOnItem(pt, item, selectedTool)) {
        return item
      }
    }
    return null
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return
    const pt = getPoint(e)
    onPointerMove(pt.x, pt.y)

    if (selectedTool === 'none') return

    const selectedItem = items.find(item => item.id === selectedItemId)
    if (selectedItem && selectedItem.type === selectedTool) {
      const handle = findResizeHandle(pt, selectedItem)
      if (handle) {
        activeDrag.current = { mode: 'resize', id: selectedItem.id, pointer: pt, item: selectedItem, handle }
        setIsDrawing(false)
        startPt.current = null
        return
      }
    }

    const existingItem = findMovableItemAtPoint(pt)
    if (existingItem) {
      setSelectedItemId(existingItem.id)
      activeDrag.current = { mode: 'move', id: existingItem.id, pointer: pt, item: existingItem }
      setIsDrawing(false)
      startPt.current = null
      return
    }

    if (selectedTool === 'text') {
      if (!pendingText.trim()) return
      const item: TextItem = {
        id: makeId(), type: 'text', color, strokeWidth, createdAt: Date.now(),
        x: pt.x, y: pt.y, text: pendingText, fontSize: 32,
      }
      onAddItem(item)
      setSelectedItemId(item.id)
      return
    }

    if (selectedTool === 'marker') {
      onAddMarker(pt.x, pt.y)
      return
    }

    setIsDrawing(true)
    setSelectedItemId(null)
    startPt.current = pt
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e)
    onPointerMove(pt.x, pt.y)
    if (activeDrag.current) {
      const drag = activeDrag.current
      const dx = pt.x - drag.pointer.x
      const dy = pt.y - drag.pointer.y
      onUpdateItem(drag.id, item => {
        if (item.id !== drag.id) return item
        return drag.mode === 'move' ? moveItem(drag.item, dx, dy) : resizeItem(drag.item, drag.handle, dx, dy)
      })
      return
    }
    if (!isDrawing || !startPt.current) return
    const preview = buildPreview(startPt.current, pt)
    if (preview) redraw(preview)
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeDrag.current) {
      activeDrag.current = null
      return
    }
    if (!isDrawing || !startPt.current) return
    const item = buildPreview(startPt.current, getPoint(e))
    if (item && hasVisibleSize(item)) {
      onAddItem(item)
      setSelectedItemId(item.id)
    }
    setIsDrawing(false)
    startPt.current = null
    redraw()
  }

  const hasVisibleSize = (item: DrawingItem): boolean => {
    switch (item.type) {
      case 'rectangle':
        return Math.abs(item.width) >= 4 && Math.abs(item.height) >= 4
      case 'circle':
        return item.radiusX >= 2 && item.radiusY >= 2
      case 'line':
      case 'arrow':
        return Math.hypot(item.endX - item.startX, item.endY - item.startY) >= 8
      case 'blur':
        return Math.abs(item.width) >= 12 && Math.abs(item.height) >= 12
      case 'text':
      case 'marker':
        return true
    }
  }

  const cursor = (): string => {
    if (!isActive) return 'default'
    if (selectedTool === 'none') return 'default'
    if (activeDrag.current?.mode === 'resize') return 'nwse-resize'
    if (['rectangle', 'circle', 'line', 'arrow', 'text', 'blur'].includes(selectedTool)) return 'grab'
    return 'crosshair'
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: isActive ? 'auto' : 'none',
          cursor: cursor(),
          zIndex: 1,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          activeDrag.current = null
          if (isDrawing) {
            setIsDrawing(false)
            startPt.current = null
            redraw()
          }
        }}
      />
      <ScreenBlurRegions items={items.filter((item): item is BlurItem => item.type === 'blur')} />
      <KokoMiteMarker markers={markers} onExpire={onExpireMarker} />
    </>
  )
}
