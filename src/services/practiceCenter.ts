import type { Character, GameType, UserProfile } from '@/types'
import { unlockAchievement } from '@/services/localDb'

export type PracticeLevel = number | 'all'

export interface PracticeSettings {
  ageGroup: UserProfile['ageGroup']
  targetLevel: PracticeLevel
}

export interface PracticeDifficulty {
  roundCount: number
  choiceCount: number
  familyCount: number
  charsPerFamily: number
  writingGoal: number
  writingMode: 'easy' | 'mixed' | 'challenge'
  label: string
  tip: string
  hintMode: 'full' | 'normal' | 'light'
}

export interface PracticeSessionSummary {
  gameType: GameType
  score: number
  correctCount: number
  totalRounds: number
  bestStreak: number
  studyMinutes: number
  characters: Character[]
}

export interface BadgeSpec {
  id: string
  icon: string
  name: string
  description: string
}

export interface DailyChallengeTask {
  id: string
  label: string
  progress: number
  target: number
  done: boolean
  unit: string
}

interface DailyProgress {
  sessions: number
  totalScore: number
  bestStreak: number
  perfectRounds: number
  gameCounts: Record<GameType, number>
}

export interface PracticeMeta {
  totalSessions: number
  totalScore: number
  bestScore: number
  bestStreak: number
  gameCounts: Record<GameType, number>
  lastPlayedAt: string | null
  dailyProgress: Record<string, DailyProgress>
}

const defaultGameCounts: Record<GameType, number> = {
  puzzle: 0,
  sort: 0,
  match: 0,
  writing: 0,
  listen: 0,
}

const badgeCatalog: BadgeSpec[] = [
  { id: 'practice-first-step', icon: '🌟', name: '起步星星', description: '第一次完成练习游戏' },
  { id: 'practice-five-sessions', icon: '🎮', name: '闯关常客', description: '累计完成 5 局练习' },
  { id: 'practice-picture-eye', icon: '🖼️', name: '看图小侦探', description: '完成 3 局看图识画' },
  { id: 'practice-listen-ear', icon: '👂', name: '听音小耳朵', description: '完成 3 局听音找字' },
  { id: 'practice-writing-spark', icon: '✏️', name: '描红小火花', description: '完成 3 局描红工坊' },
  { id: 'practice-streak-fire', icon: '🔥', name: '连胜火箭', description: '单局连对达到 4 次' },
  { id: 'practice-score-rainbow', icon: '🌈', name: '彩虹收集家', description: '累计收集 300 分' },
  { id: 'practice-daily-champion', icon: '👑', name: '每日挑战王', description: '完成当日全部练习挑战' },
]

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function metaStorageKey(profileId: string | null): string {
  return `hanzi_practice_meta_${profileId || 'guest'}`
}

function emptyDailyProgress(): DailyProgress {
  return {
    sessions: 0,
    totalScore: 0,
    bestStreak: 0,
    perfectRounds: 0,
    gameCounts: { ...defaultGameCounts },
  }
}

function emptyPracticeMeta(): PracticeMeta {
  return {
    totalSessions: 0,
    totalScore: 0,
    bestScore: 0,
    bestStreak: 0,
    gameCounts: { ...defaultGameCounts },
    lastPlayedAt: null,
    dailyProgress: {},
  }
}

function readLocalStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : fallback
  } catch {
    return fallback
  }
}

function writeLocalStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore storage quota issues
  }
}

function cleanDailyProgress(dailyProgress: Record<string, DailyProgress>): Record<string, DailyProgress> {
  const entries = Object.entries(dailyProgress)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 21)

  return Object.fromEntries(entries)
}

function resolveLevelValue(level: PracticeLevel): number {
  return level === 'all' ? 10 : level
}

function getFocusGame(settings: PracticeSettings): GameType {
  const seed = `${todayKey()}-${settings.ageGroup}-${settings.targetLevel}`
  const total = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const sequence: GameType[] = ['match', 'listen', 'puzzle', 'sort', 'writing']
  return sequence[total % sequence.length]
}

export function getGameDisplayName(gameType: GameType): string {
  const labels: Record<GameType, string> = {
    puzzle: '字形拼图',
    sort: '部首家族',
    match: '看图识画',
    writing: '描红工坊',
    listen: '听音找字',
  }
  return labels[gameType]
}

export function getPracticeBadges(): BadgeSpec[] {
  return badgeCatalog
}

export function getDefaultPracticeLevel(ageGroup: UserProfile['ageGroup']): PracticeLevel {
  const defaults: Record<UserProfile['ageGroup'], PracticeLevel> = {
    '3-4': 3,
    '5-6': 6,
    '7-8': 'all',
  }
  return defaults[ageGroup]
}

export function buildPracticeSettings(profile?: UserProfile, selectedLevel?: PracticeLevel): PracticeSettings {
  const ageGroup = profile?.ageGroup || '5-6'
  const targetLevel = selectedLevel ?? getDefaultPracticeLevel(ageGroup)
  return { ageGroup, targetLevel }
}

export function getPracticeScopeLabel(targetLevel: PracticeLevel): string {
  return targetLevel === 'all' ? '全题库 800 字' : `Level 1-${targetLevel}`
}

export function getPracticeDifficulty(settings: PracticeSettings): PracticeDifficulty {
  const baseByAge: Record<UserProfile['ageGroup'], PracticeDifficulty> = {
    '3-4': {
      roundCount: 4,
      choiceCount: 3,
      familyCount: 3,
      charsPerFamily: 2,
      writingGoal: 3,
      writingMode: 'easy',
      label: '轻松探险',
      tip: '提示更多、干扰更少，适合启蒙阶段。',
      hintMode: 'full',
    },
    '5-6': {
      roundCount: 5,
      choiceCount: 4,
      familyCount: 4,
      charsPerFamily: 3,
      writingGoal: 4,
      writingMode: 'mixed',
      label: '进阶闯关',
      tip: '图像、听音、部件三线并进。',
      hintMode: 'normal',
    },
    '7-8': {
      roundCount: 6,
      choiceCount: 4,
      familyCount: 4,
      charsPerFamily: 4,
      writingGoal: 5,
      writingMode: 'challenge',
      label: '智慧挑战',
      tip: '更强调理解、辨析和连胜挑战。',
      hintMode: 'light',
    },
  }

  const levelValue = resolveLevelValue(settings.targetLevel)
  const levelBoost = levelValue >= 8 ? 2 : levelValue >= 4 ? 1 : 0
  const base = baseByAge[settings.ageGroup]

  return {
    ...base,
    roundCount: base.roundCount + levelBoost,
    charsPerFamily: Math.min(4, base.charsPerFamily + (levelValue >= 7 ? 1 : 0)),
    writingGoal: base.writingGoal + levelBoost,
  }
}

export function filterCharactersForPractice(characters: Character[], settings: PracticeSettings): Character[] {
  const targetLevel = settings.targetLevel
  const filtered = targetLevel === 'all'
    ? characters
    : characters.filter((character) => character.level <= targetLevel)

  return filtered.length >= 12 ? filtered : characters
}

export function getPracticeMeta(profileId: string | null): PracticeMeta {
  return readLocalStorage(metaStorageKey(profileId), emptyPracticeMeta())
}

export function recordPracticeSession(profileId: string | null, summary: PracticeSessionSummary): PracticeMeta {
  const meta = getPracticeMeta(profileId)
  const date = todayKey()
  const daily = meta.dailyProgress[date] || emptyDailyProgress()

  daily.sessions += 1
  daily.totalScore += summary.score
  daily.bestStreak = Math.max(daily.bestStreak, summary.bestStreak)
  daily.perfectRounds += summary.correctCount
  daily.gameCounts[summary.gameType] += 1

  meta.totalSessions += 1
  meta.totalScore += summary.score
  meta.bestScore = Math.max(meta.bestScore, summary.score)
  meta.bestStreak = Math.max(meta.bestStreak, summary.bestStreak)
  meta.gameCounts[summary.gameType] += 1
  meta.lastPlayedAt = new Date().toISOString()
  meta.dailyProgress[date] = daily
  meta.dailyProgress = cleanDailyProgress(meta.dailyProgress)

  writeLocalStorage(metaStorageKey(profileId), meta)
  return meta
}

export function getDailyChallenges(profileId: string | null, settings: PracticeSettings, meta = getPracticeMeta(profileId)): DailyChallengeTask[] {
  const daily = meta.dailyProgress[todayKey()] || emptyDailyProgress()
  const levelValue = resolveLevelValue(settings.targetLevel)
  const sessionTarget = settings.ageGroup === '3-4' ? 1 : levelValue >= 7 ? 3 : 2
  const scoreTarget = settings.ageGroup === '3-4'
    ? 30 + levelValue * 2
    : settings.ageGroup === '5-6'
      ? 45 + levelValue * 3
      : 60 + levelValue * 4
  const focusGame = getFocusGame(settings)

  return [
    {
      id: 'sessions',
      label: `完成 ${sessionTarget} 局小游戏`,
      progress: Math.min(daily.sessions, sessionTarget),
      target: sessionTarget,
      done: daily.sessions >= sessionTarget,
      unit: '局',
    },
    {
      id: 'score',
      label: `收集 ${scoreTarget} 颗星星`,
      progress: Math.min(daily.totalScore, scoreTarget),
      target: scoreTarget,
      done: daily.totalScore >= scoreTarget,
      unit: '分',
    },
    {
      id: `focus-${focusGame}`,
      label: `完成 1 局${getGameDisplayName(focusGame)}`,
      progress: Math.min(daily.gameCounts[focusGame], 1),
      target: 1,
      done: daily.gameCounts[focusGame] >= 1,
      unit: '局',
    },
  ]
}

export async function syncPracticeAchievements(profileId: string | null, settings: PracticeSettings, meta = getPracticeMeta(profileId)): Promise<void> {
  if (!profileId) return

  const dailyChallenges = getDailyChallenges(profileId, settings, meta)
  const unlocks: string[] = []

  if (meta.totalSessions >= 1) unlocks.push('practice-first-step')
  if (meta.totalSessions >= 5) unlocks.push('practice-five-sessions')
  if (meta.gameCounts.match >= 3) unlocks.push('practice-picture-eye')
  if (meta.gameCounts.listen >= 3) unlocks.push('practice-listen-ear')
  if (meta.gameCounts.writing >= 3) unlocks.push('practice-writing-spark')
  if (meta.bestStreak >= 4) unlocks.push('practice-streak-fire')
  if (meta.totalScore >= 300) unlocks.push('practice-score-rainbow')
  if (dailyChallenges.every((task) => task.done)) unlocks.push('practice-daily-champion')

  await Promise.all(unlocks.map((id) => unlockAchievement(profileId, id)))
}
