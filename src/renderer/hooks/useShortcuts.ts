import { useEffect } from 'react'

interface Options {
  isActive: boolean
  onEscape: () => void
}

export function useShortcuts({ isActive, onEscape }: Options): void {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onEscape()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onEscape])
}
