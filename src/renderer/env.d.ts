interface Window {
  electronAPI: {
    onToggleOverlay: (callback: (visible: boolean) => void) => () => void
    onClearAll: (callback: () => void) => () => void
    onEscapeOperation: (callback: () => void) => () => void
    getScreenSource: () => Promise<{ id: string; name: string; bounds: { x: number; y: number; width: number; height: number } } | null>
    setClickThrough: () => void
    quitApp: () => void
  }
}
