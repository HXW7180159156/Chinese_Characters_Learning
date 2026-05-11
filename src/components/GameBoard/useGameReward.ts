import { useCallback } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { updateDailyStats, updateProgress } from '@/services/localDb'
import type { Character } from '@/types'

export function useGameReward() {
  const activeProfileId = useProfileStore((state) => state.activeProfileId)

  return useCallback(async (characters: Character[], minutes: number, gamesPlayed = 1) => {
    if (!activeProfileId) return

    const today = new Date().toISOString().slice(0, 10)
    await updateDailyStats(activeProfileId, today, {
      studySeconds: minutes * 60,
      wordsLearned: characters.length,
      gamesPlayed,
    })

    await Promise.all(
      characters.map((character) => updateProgress(activeProfileId, character.id, {
        status: 'learning',
        reviewCount: 1,
        correctCount: 1,
        lastReviewed: new Date().toISOString(),
        masteryLevel: 1,
      })),
    )
  }, [activeProfileId])
}
