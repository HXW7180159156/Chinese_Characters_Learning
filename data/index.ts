import type { Character } from '../src/types'

// ===== Static metadata — no data imports needed (HomePage doesn't bundle data) =====
export const levelMeta = [
  { id: 1, title: '象形字入门', subtitle: '自然万物', emoji: '🌞', chars: 80, color: 'bg-kid-red' },
  { id: 2, title: '指事会意字', subtitle: '数字与认知', emoji: '✋', chars: 80, color: 'bg-kid-orange' },
  { id: 3, title: '偏旁王国', subtitle: '部首入门', emoji: '🏰', chars: 80, color: 'bg-kid-yellow' },
  { id: 4, title: '会意字谜', subtitle: '字谜乐园', emoji: '🧩', chars: 80, color: 'bg-kid-green' },
  { id: 5, title: '形声字(一)', subtitle: '自然世界', emoji: '🌿', chars: 80, color: 'bg-kid-blue' },
  { id: 6, title: '形声字(二)', subtitle: '人物家庭', emoji: '👨‍👩‍👧‍👦', chars: 80, color: 'bg-kid-purple' },
  { id: 7, title: '形声字(三)', subtitle: '动作表情', emoji: '🏃', chars: 80, color: 'bg-kid-pink' },
  { id: 8, title: '形声字(四)', subtitle: '生活器物', emoji: '🪑', chars: 80, color: 'bg-kid-red' },
  { id: 9, title: '形声字(五)', subtitle: '抽象概念', emoji: '💡', chars: 80, color: 'bg-kid-orange' },
  { id: 10, title: '综合拓展', subtitle: '科技文化', emoji: '🚀', chars: 80, color: 'bg-kid-blue' },
]

export function getLevelName(level: number): string {
  const names: Record<number, string> = {
    1: '象形字入门 — 自然万物', 2: '指事会意 — 数字与认知',
    3: '偏旁王国 — 部首入门', 4: '会意字谜 — 字谜乐园',
    5: '形声字(一) — 自然世界', 6: '形声字(二) — 人物家庭',
    7: '形声字(三) — 动作表情', 8: '形声字(四) — 生活器物',
    9: '形声字(五) — 抽象概念', 10: '综合拓展 — 科技文化',
  }
  return names[level] || `Level ${level}`
}

// ===== Lazy loaders — each level is a separate code-split chunk =====
const levelLoaders: Record<number, () => Promise<{ default: Character[] }>> = {
  1: () => import('./level-01-pictographic'),
  2: () => import('./level-02-ideographic'),
  3: () => import('./level-03-radicals'),
  4: () => import('./level-04-compound'),
  5: () => import('./level-05-nature'),
  6: () => import('./level-06-family'),
  7: () => import('./level-07-action'),
  8: () => import('./level-08-objects'),
  9: () => import('./level-09-abstract'),
  10: () => import('./level-10-comprehensive'),
}

const levelCache = new Map<number, Character[]>()

let allCharsCache: Character[] | null = null

// ===== Core functions — load lazily, cache forever =====

export async function getCharactersByLevel(level: number): Promise<Character[]> {
  if (levelCache.has(level)) return levelCache.get(level)!
  const loader = levelLoaders[level]
  if (!loader) return []
  const mod = await loader()
  levelCache.set(level, mod.default)
  return mod.default
}

export async function getAllCharacters(): Promise<Character[]> {
  if (allCharsCache) return allCharsCache
  const seen = new Set<string>()
  const result: Character[] = []
  for (let level = 1; level <= 10; level++) {
    const chars = await getCharactersByLevel(level)
    for (const c of chars) {
      if (!seen.has(c.char)) {
        seen.add(c.char)
        result.push(c)
      }
    }
  }
  allCharsCache = result
  return result
}

// Synchronous accessor for already-loaded data (no fallback)
export function getLoadedAllCharacters(): Character[] {
  return allCharsCache || []
}

export function getLoadedCharactersByLevel(level: number): Character[] {
  return levelCache.get(level) || []
}
