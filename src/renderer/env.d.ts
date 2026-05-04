interface Window {
  electronAPI: {
    onToggleOverlay: (callback: (visible: boolean) => void) => () => void
    onClearAll: (callback: () => void) => () => void
    setClickThrough: () => void
    quitApp: () => void
  }
}
