import { useState, useCallback } from 'react'
import type { DrawingItem } from '../types/drawing'

type UseDrawingResult = {
  items: DrawingItem[]
  addItem: (item: DrawingItem) => void
  updateItem: (id: string, updater: (item: DrawingItem) => DrawingItem) => void
  undoLast: () => void
  clearAll: () => void
}

export function useDrawing(): UseDrawingResult {
  const [items, setItems] = useState<DrawingItem[]>([])

  const addItem = useCallback((item: DrawingItem) => {
    setItems(prev => [...prev, item])
  }, [])

  const updateItem = useCallback((id: string, updater: (item: DrawingItem) => DrawingItem) => {
    setItems(prev => prev.map(item => item.id === id ? updater(item) : item))
  }, [])

  const undoLast = useCallback(() => {
    setItems(prev => prev.slice(0, -1))
  }, [])

  const clearAll = useCallback(() => {
    setItems([])
  }, [])

  return { items, addItem, updateItem, undoLast, clearAll }
}
