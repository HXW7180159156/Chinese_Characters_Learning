/// <reference types="vite/client" />

interface ElectronDbAPI {
  getProfiles: () => Promise<unknown[]>
  getProfile: (id: string) => Promise<unknown>
  createProfile: (profile: Record<string, unknown>) => Promise<unknown>
  updateProfile: (id: string, data: Record<string, unknown>) => Promise<unknown>
  deleteProfile: (id: string) => Promise<unknown>
  getProgress: (profileId: string) => Promise<unknown[]>
  updateProgress: (profileId: string, charId: number, data: Record<string, unknown>) => Promise<unknown>
  getDailyStats: (profileId: string, days?: number) => Promise<unknown[]>
  updateDailyStats: (profileId: string, date: string, data: Record<string, unknown>) => Promise<unknown>
  getAchievements: (profileId: string) => Promise<unknown[]>
  unlockAchievement: (profileId: string, achievementId: string) => Promise<unknown>
}

interface Window {
  electronAPI?: {
    platform: string
    isDev: boolean
    db: ElectronDbAPI
  }
}
