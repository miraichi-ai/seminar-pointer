import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  onToggleOverlay: (callback: (visible: boolean) => void): (() => void) => {
    const handler = (_: Electron.IpcRendererEvent, visible: boolean) => callback(visible)
    ipcRenderer.on('toggle-overlay', handler)
    return () => ipcRenderer.off('toggle-overlay', handler)
  },
  onClearAll: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('clear-all', handler)
    return () => ipcRenderer.off('clear-all', handler)
  },
  setClickThrough: (): void => {
    ipcRenderer.send('set-click-through')
  },
})
