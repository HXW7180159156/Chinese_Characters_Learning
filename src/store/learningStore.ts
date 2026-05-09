import { create } from 'zustand'
import type { LearningProgress, LearningReport, Achievement } from '@/types'

interface LearningState {
  progress: Map<number, LearningProgress>
  achievements: Achievement[]
  unlockedAchievements: string[]
  updateProgress: (charId: number, data: Partial<LearningProgress>) => void
  getReport: () => LearningReport
  unlockAchievement: (id: string) => void
}

export const useLearningStore = create<LearningState>((set, get) => ({
  progress: new Map(),
  achievements: [],
  unlockedAchievements: [],
  updateProgress: (charId, data) =>
    set((s) => {
      const existing = s.progress.get(charId)
      const updated = existing
        ? { ...existing, ...data }
        : {
            charId,
            status: 'new' as const,
            reviewCount: 0,
            correctCount: 0,
            lastReviewed: null,
            masteryLevel: 0,
            ...data,
          }
      const newMap = new Map(s.progress)
      newMap.set(charId, updated)
      return { progress: newMap }
    }),
  getReport: () => {
    const { progress } = get()
    const all = Array.from(progress.values())
    return {
      totalCharacters: all.length,
      masteredCharacters: all.filter((p) => p.status === 'mastered').length,
      learningCharacters: all.filter((p) => p.status === 'learning' || p.status === 'reviewing').length,
      newCharacters: all.filter((p) => p.status === 'new').length,
      todayStudyTime: 0,
      todayWordsLearned: 0,
      weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
      weakPoints: [],
    }
  },
  unlockAchievement: (id) =>
    set((s) => ({
      unlockedAchievements: s.unlockedAchievements.includes(id)
        ? s.unlockedAchievements
        : [...s.unlockedAchievements, id],
    })),
}))
