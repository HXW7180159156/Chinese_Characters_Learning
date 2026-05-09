export type ConstructionType = '象形' | '指事' | '会意' | '形声'

export type Theme = '自然' | '身体' | '家庭' | '动作' | '器物' | '抽象' | '科技' | '历史' | '生活' | '社会'

export interface CharacterComponent {
  char: string
  position: '左' | '右' | '上' | '下' | '外' | '内' | '全'
  role: '形旁' | '声旁' | '部件'
}

export interface CharacterWord {
  word: string
  pinyin: string
  meaning: string
}

export interface Character {
  id: number
  char: string
  pinyin: string
  tone: 1 | 2 | 3 | 4 | 0
  radical: string
  radicalName: string
  strokeCount: number
  strokes?: string[]
  constructionType: ConstructionType
  components: CharacterComponent[]
  etymology: string
  imagePrompt: string
  theme: Theme
  level: number
  words: CharacterWord[]
  sentence: string
  funFact: string
  tags: string[]
}

export interface LearningProgress {
  charId: number
  status: 'new' | 'learning' | 'reviewing' | 'mastered'
  reviewCount: number
  correctCount: number
  lastReviewed: string | null
  masteryLevel: number
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  ageGroup: '3-4' | '5-6' | '7-8'
  dailyTimeLimit: number
  dailyWordGoal: number
  createdAt: string
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: string
}

export interface LearningReport {
  totalCharacters: number
  masteredCharacters: number
  learningCharacters: number
  newCharacters: number
  todayStudyTime: number
  todayWordsLearned: number
  weeklyProgress: number[]
  weakPoints: string[]
}

export type GameType = 'puzzle' | 'sort' | 'match' | 'writing' | 'listen'
