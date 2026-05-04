import type {
  DrawingItem,
  RectangleItem,
  CircleItem,
  LineItem,
  ArrowItem,
  TextItem,
  BlurItem,
} from '../types/drawing'

export function drawItem(ctx: CanvasRenderingContext2D, item: DrawingItem): void {
  ctx.save()
  ctx.strokeStyle = item.color
  ctx.fillStyle = item.color
  ctx.lineWidth = item.strokeWidth ?? 4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  switch (item.type) {
    case 'rectangle': drawRectangle(ctx, item); break
    case 'circle':    drawCircle(ctx, item);    break
    case 'line':      drawLine(ctx, item);      break
    case 'arrow':     drawArrow(ctx, item);     break
    case 'text':      drawText(ctx, item);      break
    case 'marker':    break
    case 'blur':      drawBlurPlaceholder(ctx, item); break
  }

  ctx.restore()
}

function drawBlurPlaceholder(ctx: CanvasRenderingContext2D, item: BlurItem): void {
  const x = item.width < 0 ? item.x + item.width : item.x
  const y = item.height < 0 ? item.y + item.height : item.y
  const w = Math.abs(item.width)
  const h = Math.abs(item.height)
  if (w < 2 || h < 2) return

  ctx.save()
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.72)'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.setLineDash([8, 7])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 8)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawRectangle(ctx: CanvasRenderingContext2D, item: RectangleItem): void {
  const x = item.width  < 0 ? item.x + item.width  : item.x
  const y = item.height < 0 ? item.y + item.height : item.y
  const w = Math.abs(item.width)
  const h = Math.abs(item.height)
  if (w < 2 || h < 2) return
  const r = Math.min(8, w / 2, h / 2)

  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.stroke()
}

function drawCircle(ctx: CanvasRenderingContext2D, item: CircleItem): void {
  if (item.radiusX < 1 || item.radiusY < 1) return
  ctx.beginPath()
  ctx.ellipse(item.x, item.y, Math.abs(item.radiusX), Math.abs(item.radiusY), 0, 0, Math.PI * 2)
  ctx.stroke()
}

function drawLine(ctx: CanvasRenderingContext2D, item: LineItem): void {
  ctx.beginPath()
  ctx.moveTo(item.startX, item.startY)
  ctx.lineTo(item.endX, item.endY)
  ctx.stroke()
}

function drawArrow(ctx: CanvasRenderingContext2D, item: ArrowItem): void {
  const { startX, startY, endX, endY } = item
  const dx = endX - startX
  const dy = endY - startY
  const len = Math.hypot(dx, dy)
  if (len < 8) return

  const angle = Math.atan2(dy, dx)
  const headLen = Math.min(26, Math.max(10, len * 0.28))
  const headAngle = Math.PI / 6

  ctx.beginPath()
  ctx.moveTo(startX, startY)
  ctx.lineTo(endX, endY)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(endX, endY)
  ctx.lineTo(
    endX - headLen * Math.cos(angle - headAngle),
    endY - headLen * Math.sin(angle - headAngle)
  )
  ctx.moveTo(endX, endY)
  ctx.lineTo(
    endX - headLen * Math.cos(angle + headAngle),
    endY - headLen * Math.sin(angle + headAngle)
  )
  ctx.stroke()
}

function drawText(ctx: CanvasRenderingContext2D, item: TextItem): void {
  ctx.font = `bold ${item.fontSize}px 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif`
  ctx.textBaseline = 'top'
  ctx.shadowColor = 'rgba(0,0,0,0.55)'
  ctx.shadowBlur = 5
  ctx.fillStyle = item.color
  const lineHeight = item.fontSize * 1.25
  item.text.split(/\r?\n/).forEach((line, index) => {
    ctx.fillText(line, item.x, item.y + lineHeight * index)
  })
}
