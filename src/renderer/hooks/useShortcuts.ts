import { useEffect } from 'react'

interface Options {
  isActive: boolean
  onEscape: () => void
  onUndo: () => void
  onPulseMarker: () => void
}

export function useShortcuts({ isActive, onEscape, onUndo, onPulseMarker }: Options): void {
  useEffect(() => {
    if (!isActive) return

    let lastMetaTapAt = 0

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape()
        return
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        onUndo()
        return
      }

      if (e.key === 'Control' && !e.repeat) {
        const now = Date.now()
        if (now - lastMetaTapAt <= 450) {
          e.preventDefault()
          lastMetaTapAt = 0
          onPulseMarker()
        } else {
          lastMetaTapAt = now
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onEscape, onUndo, onPulseMarker])
}
