import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  isDev: process.env.NODE_ENV === 'development',

  db: {
    getProfiles: () => ipcRenderer.invoke('db:getProfiles'),
    getProfile: (id: string) => ipcRenderer.invoke('db:getProfile', id),
    createProfile: (profile: Record<string, unknown>) => ipcRenderer.invoke('db:createProfile', profile),
    updateProfile: (id: string, data: Record<string, unknown>) => ipcRenderer.invoke('db:updateProfile', id, data),
    deleteProfile: (id: string) => ipcRenderer.invoke('db:deleteProfile', id),

    getProgress: (profileId: string) => ipcRenderer.invoke('db:getProgress', profileId),
    updateProgress: (profileId: string, charId: number, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:updateProgress', profileId, charId, data),

    getDailyStats: (profileId: string, days?: number) => ipcRenderer.invoke('db:getDailyStats', profileId, days),
    updateDailyStats: (profileId: string, date: string, data: Record<string, unknown>) =>
      ipcRenderer.invoke('db:updateDailyStats', profileId, date, data),

    getAchievements: (profileId: string) => ipcRenderer.invoke('db:getAchievements', profileId),
    unlockAchievement: (profileId: string, achievementId: string) =>
      ipcRenderer.invoke('db:unlockAchievement', profileId, achievementId),
  },
})
