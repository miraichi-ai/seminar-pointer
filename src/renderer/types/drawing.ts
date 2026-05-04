export type DrawingTool =
  | 'none'
  | 'rectangle'
  | 'circle'
  | 'line'
  | 'arrow'
  | 'text'
  | 'marker'
  | 'blur'

export type BaseItem = {
  id: string
  type: string
  color: string
  strokeWidth?: number
  createdAt: number
}

export type RectangleItem = BaseItem & {
  type: 'rectangle'
  x: number
  y: number
  width: number
  height: number
}

export type CircleItem = BaseItem & {
  type: 'circle'
  x: number
  y: number
  radiusX: number
  radiusY: number
}

export type LineItem = BaseItem & {
  type: 'line'
  startX: number
  startY: number
  endX: number
  endY: number
}

export type ArrowItem = BaseItem & {
  type: 'arrow'
  startX: number
  startY: number
  endX: number
  endY: number
}

export type TextItem = BaseItem & {
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number
}

export type MarkerItem = BaseItem & {
  type: 'marker'
  x: number
  y: number
  label: string
  durationMs: number
}

export type BlurItem = BaseItem & {
  type: 'blur'
  x: number
  y: number
  width: number
  height: number
  blurPx: number
}

export type DrawingItem =
  | RectangleItem
  | CircleItem
  | LineItem
  | ArrowItem
  | TextItem
  | MarkerItem
  | BlurItem
