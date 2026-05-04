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
  onEscapeOperation: (callback: () => void): (() => void) => {
    const handler = () => callback()
    ipcRenderer.on('escape-operation', handler)
    return () => ipcRenderer.off('escape-operation', handler)
  },
  getScreenSource: (): Promise<{ id: string; name: string; bounds: { x: number; y: number; width: number; height: number } } | null> => {
    return ipcRenderer.invoke('get-screen-source')
  },
  setClickThrough: (): void => {
    ipcRenderer.send('set-click-through')
  },
  quitApp: (): void => {
    ipcRenderer.send('quit-app')
  },
})
