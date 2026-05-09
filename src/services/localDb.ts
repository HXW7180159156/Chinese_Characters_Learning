import type { UserProfile, LearningProgress } from '@/types'

function hasElectronDB(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.db
}

function db() {
  return window.electronAPI!.db
}

function localStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function localStorageSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* ignore quota errors */ }
}

// Profiles
export async function getProfiles(): Promise<UserProfile[]> {
  if (hasElectronDB()) return (await db().getProfiles()) as UserProfile[]
  return localStorageGet<UserProfile[]>('hanzi_profiles', [])
}

export async function createProfile(profile: UserProfile): Promise<void> {
  if (hasElectronDB()) {
    await db().createProfile({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      ageGroup: profile.ageGroup,
      dailyTimeLimit: profile.dailyTimeLimit,
      dailyWordGoal: profile.dailyWordGoal,
    })
  } else {
    const profiles = await getProfiles()
    profiles.push(profile)
    localStorageSet('hanzi_profiles', profiles)
  }
}

export async function updateProfile(id: string, data: Partial<UserProfile>): Promise<void> {
  if (hasElectronDB()) {
    const dbData: Record<string, unknown> = {}
    if (data.name !== undefined) dbData.name = data.name
    if (data.avatar !== undefined) dbData.avatar = data.avatar
    if (data.ageGroup !== undefined) dbData.age_group = data.ageGroup
    if (data.dailyTimeLimit !== undefined) dbData.daily_time_limit = data.dailyTimeLimit
    if (data.dailyWordGoal !== undefined) dbData.daily_word_goal = data.dailyWordGoal
    await db().updateProfile(id, dbData)
  } else {
    const profiles = await getProfiles()
    const idx = profiles.findIndex((p) => p.id === id)
    if (idx >= 0) {
      profiles[idx] = { ...profiles[idx], ...data }
      localStorageSet('hanzi_profiles', profiles)
    }
  }
}

export async function deleteProfile(id: string): Promise<void> {
  if (hasElectronDB()) {
    await db().deleteProfile(id)
  } else {
    const profiles = (await getProfiles()).filter((p) => p.id !== id)
    localStorageSet('hanzi_profiles', profiles)
  }
}

// Progress
export async function getProgress(profileId: string): Promise<LearningProgress[]> {
  if (hasElectronDB()) return (await db().getProgress(profileId)) as LearningProgress[]
  return localStorageGet<LearningProgress[]>(`hanzi_progress_${profileId}`, [])
}

export async function updateProgress(
  profileId: string,
  charId: number,
  data: Partial<LearningProgress>,
): Promise<void> {
  if (hasElectronDB()) {
    const dbData: Record<string, unknown> = {}
    if (data.status !== undefined) dbData.status = data.status
    if (data.reviewCount !== undefined) dbData.reviewCount = data.reviewCount
    if (data.correctCount !== undefined) dbData.correctCount = data.correctCount
    if (data.lastReviewed !== undefined) dbData.lastReviewed = data.lastReviewed
    if (data.masteryLevel !== undefined) dbData.masteryLevel = data.masteryLevel
    await db().updateProgress(profileId, charId, dbData)
  } else {
    const progress = await getProgress(profileId)
    const idx = progress.findIndex((p) => p.charId === charId)
    if (idx >= 0) {
      progress[idx] = { ...progress[idx], ...data }
    } else {
      progress.push({
        charId,
        status: 'new',
        reviewCount: 0,
        correctCount: 0,
        lastReviewed: null,
        masteryLevel: 0,
        ...data,
      })
    }
    localStorageSet(`hanzi_progress_${profileId}`, progress)
  }
}

// Daily Stats
export async function getDailyStats(profileId: string, days = 7): Promise<unknown[]> {
  if (hasElectronDB()) return db().getDailyStats(profileId, days)
  return localStorageGet(`hanzi_stats_${profileId}`, [])
}

export async function updateDailyStats(
  profileId: string,
  date: string,
  data: { studySeconds?: number; wordsLearned?: number; gamesPlayed?: number },
): Promise<void> {
  if (hasElectronDB()) {
    await db().updateDailyStats(profileId, date, data)
  } else {
    const stats: Record<string, unknown>[] = (await getDailyStats(profileId, 365)) as Record<string, unknown>[]
    const existing = stats.find((s) => s.date === date)
    if (existing) {
      Object.assign(existing, {
        study_seconds: (Number(existing.study_seconds) || 0) + (data.studySeconds || 0),
        words_learned: (Number(existing.words_learned) || 0) + (data.wordsLearned || 0),
        games_played: (Number(existing.games_played) || 0) + (data.gamesPlayed || 0),
      })
    } else {
      stats.push({
        date,
        profile_id: profileId,
        study_seconds: data.studySeconds || 0,
        words_learned: data.wordsLearned || 0,
        games_played: data.gamesPlayed || 0,
      })
    }
    localStorageSet(`hanzi_stats_${profileId}`, stats)
  }
}

// Achievements
export async function getAchievements(profileId: string): Promise<string[]> {
  if (hasElectronDB()) {
    const rows = (await db().getAchievements(profileId)) as { achievement_id: string }[]
    return rows.map((r) => r.achievement_id)
  }
  return localStorageGet<string[]>(`hanzi_achievements_${profileId}`, [])
}

export async function unlockAchievement(profileId: string, achievementId: string): Promise<void> {
  if (hasElectronDB()) {
    await db().unlockAchievement(profileId, achievementId)
  } else {
    const achievements = await getAchievements(profileId)
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId)
      localStorageSet(`hanzi_achievements_${profileId}`, achievements)
    }
  }
}
