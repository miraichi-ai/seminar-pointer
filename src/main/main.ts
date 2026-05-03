import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null
let isOverlayActive = false

function getAllDisplayBounds(): Electron.Rectangle {
  const displays = screen.getAllDisplays()
  const left = Math.min(...displays.map(display => display.bounds.x))
  const top = Math.min(...displays.map(display => display.bounds.y))
  const right = Math.max(...displays.map(display => display.bounds.x + display.bounds.width))
  const bottom = Math.max(...displays.map(display => display.bounds.y + display.bounds.height))

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  }
}

function setOverlayActive(active: boolean): void {
  if (!mainWindow) return

  isOverlayActive = active
  if (active) {
    mainWindow.setIgnoreMouseEvents(false)
    mainWindow.focus()
  } else {
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
  }
  mainWindow.webContents.send('toggle-overlay', isOverlayActive)
}

function createWindow(): void {
  const { x, y, width, height } = getAllDisplayBounds()

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  })

  mainWindow.setIgnoreMouseEvents(true, { forward: true })
  mainWindow.setAlwaysOnTop(true, 'screen-saver')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
    isOverlayActive = false
  })
}

function registerShortcuts(): void {
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    setOverlayActive(!isOverlayActive)
  })

  globalShortcut.register('CommandOrControl+Shift+C', () => {
    if (!mainWindow) return
    mainWindow.webContents.send('clear-all')
  })
}

app.whenReady().then(() => {
  createWindow()
  registerShortcuts()

  const resizeOverlayWindow = () => {
    if (!mainWindow) return
    mainWindow.setBounds(getAllDisplayBounds())
  }

  screen.on('display-added', resizeOverlayWindow)
  screen.on('display-removed', resizeOverlayWindow)
  screen.on('display-metrics-changed', resizeOverlayWindow)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

ipcMain.on('set-click-through', () => {
  setOverlayActive(false)
})
