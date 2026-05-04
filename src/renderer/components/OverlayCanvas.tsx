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
} from '../types/drawing'
import { drawItem } from '../utils/drawingUtils'
import { KokoMiteMarker } from './KokoMiteMarker'

interface Props {
  isActive: boolean
  selectedTool: DrawingTool
  color: string
  strokeWidth: number
  pendingText: string
  items: DrawingItem[]
  markers: MarkerItem[]
  onAddItem: (item: DrawingItem) => void
  onAddMarker: (x: number, y: number) => void
  onExpireMarker: (id: string) => void
  onPointerMove: (x: number, y: number) => void
}

type Point = { x: number; y: number }

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
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
  onAddMarker,
  onExpireMarker,
  onPointerMove,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const startPt = useRef<Point | null>(null)
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
      items.forEach(item => drawItem(ctx, item))
      if (previewItem) drawItem(ctx, previewItem)
    },
    [items]
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
      default:
        return null
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isActive) return
    const pt = getPoint(e)
    onPointerMove(pt.x, pt.y)

    if (selectedTool === 'none') return

    if (selectedTool === 'text') {
      if (!pendingText.trim()) return
      const item: TextItem = {
        id: makeId(), type: 'text', color, strokeWidth, createdAt: Date.now(),
        x: pt.x, y: pt.y, text: pendingText, fontSize: 32,
      }
      onAddItem(item)
      return
    }

    if (selectedTool === 'marker') {
      onAddMarker(pt.x, pt.y)
      return
    }

    setIsDrawing(true)
    startPt.current = pt
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getPoint(e)
    onPointerMove(pt.x, pt.y)
    if (!isDrawing || !startPt.current) return
    const preview = buildPreview(startPt.current, pt)
    if (preview) redraw(preview)
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPt.current) return
    const item = buildPreview(startPt.current, getPoint(e))
    if (item && hasVisibleSize(item)) onAddItem(item)
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
      case 'text':
      case 'marker':
        return true
    }
  }

  const cursor = (): string => {
    if (!isActive) return 'default'
    if (selectedTool === 'none') return 'default'
    if (selectedTool === 'text') return 'text'
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
        onMouseLeave={() => { if (isDrawing) { setIsDrawing(false); startPt.current = null; redraw() } }}
      />
      <KokoMiteMarker markers={markers} onExpire={onExpireMarker} />
    </>
  )
}
