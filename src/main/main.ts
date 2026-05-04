import { app, BrowserWindow, Menu, Tray, globalShortcut, ipcMain, nativeImage, screen, desktopCapturer } from 'electron'
import { join } from 'path'

let mainWindow: BrowserWindow | null = null
let isOverlayActive = false
let tray: Tray | null = null

function registerShortcut(accelerator: string, callback: () => void): void {
  const registered = globalShortcut.register(accelerator, callback)
  if (!registered) console.warn(`Failed to register shortcut: ${accelerator}`)
}

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

function updateWindowMouseBehavior(): void {
  if (!mainWindow) return
  if (isOverlayActive) {
    mainWindow.setIgnoreMouseEvents(false)
    mainWindow.focus()
  } else {
    mainWindow.setIgnoreMouseEvents(true, { forward: true })
  }
}

function setOverlayActive(active: boolean): void {
  if (!mainWindow) return

  isOverlayActive = active
  updateWindowMouseBehavior()
  mainWindow.webContents.send('toggle-overlay', isOverlayActive)
  updateTrayMenu()
}

function updateTrayMenu(): void {
  if (!tray) return

  tray.setTitle(isOverlayActive ? 'Seminar Pointer ●' : 'Seminar Pointer')
  tray.setToolTip(`Seminar Pointer: ${isOverlayActive ? '表示中' : '待機中'}`)
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: `状態: ${isOverlayActive ? '表示中' : '待機中'}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: isOverlayActive ? 'オーバーレイを隠す' : 'オーバーレイを表示',
      accelerator: 'CommandOrControl+Shift+S',
      click: () => setOverlayActive(!isOverlayActive),
    },
    {
      label: '全消去',
      accelerator: 'CommandOrControl+Shift+C',
      click: () => mainWindow?.webContents.send('clear-all'),
    },
    {
      label: 'Seminar Pointer を終了',
      accelerator: 'CommandOrControl+Q',
      click: () => app.quit(),
    },
  ]))
}

function createTray(): void {
  const trayImage = nativeImage.createFromBuffer(Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]))
  tray = new Tray(trayImage)
  tray.on('click', () => setOverlayActive(!isOverlayActive))
  updateTrayMenu()
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
  const toggleOverlay = () => {
    setOverlayActive(!isOverlayActive)
  }

  registerShortcut('CommandOrControl+Shift+S', toggleOverlay)
  registerShortcut('CommandOrControl+Shift+F', toggleOverlay)

  registerShortcut('CommandOrControl+Shift+C', () => {
    if (!mainWindow) return
    mainWindow.webContents.send('clear-all')
  })

  registerShortcut('Esc', () => {
    mainWindow?.webContents.send('escape-operation')
  })
}

app.whenReady().then(() => {
  createWindow()
  createTray()
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

ipcMain.handle('get-screen-source', async () => {
  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const windowBounds = mainWindow?.getBounds() ?? getAllDisplayBounds()
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 0, height: 0 },
  })
  const matchingSource = sources.find(source => source.display_id === String(display.id)) ?? sources[0]
  return matchingSource
    ? {
        id: matchingSource.id,
        name: matchingSource.name,
        bounds: {
          x: display.bounds.x - windowBounds.x,
          y: display.bounds.y - windowBounds.y,
          width: display.bounds.width,
          height: display.bounds.height,
        },
      }
    : null
})

ipcMain.on('quit-app', () => {
  app.quit()
})
