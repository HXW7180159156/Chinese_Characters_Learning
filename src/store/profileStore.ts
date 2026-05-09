import { create } from 'zustand'
import type { UserProfile } from '@/types'
import * as db from '@/services/localDb'

interface ProfileState {
  profiles: UserProfile[]
  activeProfileId: string | null
  loaded: boolean
  loadProfiles: () => Promise<void>
  addProfile: (profile: UserProfile) => Promise<void>
  setActive: (id: string) => void
  updateProfile: (id: string, data: Partial<UserProfile>) => Promise<void>
  removeProfile: (id: string) => Promise<void>
  getActiveProfile: () => UserProfile | undefined
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  loaded: false,

  loadProfiles: async () => {
    const profiles = await db.getProfiles()
    const saved = localStorage.getItem('hanzi_active_profile')
    set({
      profiles,
      activeProfileId: saved || (profiles.length > 0 ? profiles[0].id : null),
      loaded: true,
    })
  },

  addProfile: async (profile) => {
    await db.createProfile(profile)
    set((s) => ({
      profiles: [...s.profiles, profile],
      activeProfileId: profile.id,
    }))
    localStorage.setItem('hanzi_active_profile', profile.id)
  },

  setActive: (id) => {
    set({ activeProfileId: id })
    localStorage.setItem('hanzi_active_profile', id)
  },

  updateProfile: async (id, data) => {
    await db.updateProfile(id, data)
    set((s) => ({
      profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...data } : p)),
    }))
  },

  removeProfile: async (id) => {
    await db.deleteProfile(id)
    set((s) => {
      const remaining = s.profiles.filter((p) => p.id !== id)
      const nextActiveId = s.activeProfileId === id
        ? (remaining.length > 0 ? remaining[0].id : null)
        : s.activeProfileId
      if (nextActiveId) localStorage.setItem('hanzi_active_profile', nextActiveId)
      else localStorage.removeItem('hanzi_active_profile')
      return { profiles: remaining, activeProfileId: nextActiveId }
    })
  },

  getActiveProfile: () => {
    const { profiles, activeProfileId } = get()
    return profiles.find((p) => p.id === activeProfileId)
  },
}))
