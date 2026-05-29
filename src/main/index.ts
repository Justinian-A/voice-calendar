import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { database } from './database'
import { registerIpcHandlers } from './ipc-handlers'
import { emailService } from './email-service'
import { reminderScheduler } from './reminder-scheduler'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.voice-calendar')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // 注册IPC处理（必须在窗口创建前）
  registerIpcHandlers()

  // 先创建窗口，让用户立即看到界面
  createWindow()

  // 异步初始化服务，不阻塞窗口显示
  database.init().then(() => {
    console.log('数据库初始化完成')
  }).catch(err => {
    console.error('数据库初始化失败:', err)
  })

  // 邮件服务异步初始化，不阻塞
  emailService.init().then(success => {
    console.log('邮件服务初始化:', success ? '成功' : '失败')
  }).catch(err => {
    console.error('邮件服务初始化失败:', err)
  })

  // 启动提醒调度器
  reminderScheduler.init()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  reminderScheduler.stop()
  database.close()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
