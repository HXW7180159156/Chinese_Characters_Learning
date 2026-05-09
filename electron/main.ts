import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import * as db from './database'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: '汉字小探险',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function setupIpcHandlers() {
  // Profiles
  ipcMain.handle('db:getProfiles', () => db.getProfiles())
  ipcMain.handle('db:getProfile', (_e, id: string) => db.getProfile(id))
  ipcMain.handle('db:createProfile', (_e, profile) => db.createProfile(profile))
  ipcMain.handle('db:updateProfile', (_e, id: string, data) => db.updateProfile(id, data))
  ipcMain.handle('db:deleteProfile', (_e, id: string) => db.deleteProfile(id))

  // Progress
  ipcMain.handle('db:getProgress', (_e, profileId: string) => db.getProgress(profileId))
  ipcMain.handle('db:updateProgress', (_e, profileId: string, charId: number, data) =>
    db.updateProgress(profileId, charId, data))

  // Stats
  ipcMain.handle('db:getDailyStats', (_e, profileId: string, days?: number) =>
    db.getDailyStats(profileId, days))
  ipcMain.handle('db:updateDailyStats', (_e, profileId: string, date: string, data) =>
    db.updateDailyStats(profileId, date, data))

  // Achievements
  ipcMain.handle('db:getAchievements', (_e, profileId: string) => db.getAchievements(profileId))
  ipcMain.handle('db:unlockAchievement', (_e, profileId: string, achievementId: string) =>
    db.unlockAchievement(profileId, achievementId))
}

app.whenReady().then(() => {
  db.initDatabase()
  setupIpcHandlers()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
