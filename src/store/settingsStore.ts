import { create } from 'zustand'

interface SettingsState {
  soundEnabled: boolean
  vibrationEnabled: boolean
  fontSize: 'normal' | 'large' | 'xlarge'
  theme: 'light' | 'colorful'
  toggleSound: () => void
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void
  setTheme: (theme: 'light' | 'colorful') => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  soundEnabled: true,
  vibrationEnabled: false,
  fontSize: 'normal',
  theme: 'colorful',
  toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
  setFontSize: (fontSize) => set({ fontSize }),
  setTheme: (theme) => set({ theme }),
}))
