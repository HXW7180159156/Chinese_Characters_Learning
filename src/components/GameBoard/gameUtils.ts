import type { Character, CharacterComponent } from '@/types'

export interface PuzzlePiece {
  id: string
  char: string
  position: CharacterComponent['position']
  role: CharacterComponent['role']
  source: 'answer' | 'distractor'
}

export interface PuzzleRound {
  answer: Character
  slots: PuzzlePiece[]
  tray: PuzzlePiece[]
}

export interface ChoiceRound {
  answer: Character
  choices: Character[]
}

export interface RadicalFamily {
  radical: string
  label: string
  characters: Character[]
}

export const praiseMessages = [
  '🎉 太棒啦，答对了！',
  '🌟 你的小脑袋真灵光！',
  '🥳 又闯过一关啦！',
  '🚀 识字火箭继续前进！',
]

export const retryMessages = [
  '🤔 再想一想，马上就对啦。',
  '💪 没关系，再试一次！',
  '🫶 已经很接近了，再看看线索。',
  '✨ 换个角度想想看。',
]

export function randomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)] || ''
}

export function shuffleItems<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function sampleItems<T>(items: T[], count: number): T[] {
  return shuffleItems(items).slice(0, Math.max(0, count))
}

export function pickRandomItem<T>(items: T[], fallback: T): T {
  if (items.length === 0) return fallback
  return items[Math.floor(Math.random() * items.length)]
}

export function buildSentenceHint(sentence: string, char: string): string {
  if (!sentence) return ''
  return sentence.replace(char, '□')
}

export function getDisplayWord(character: Character): string {
  return character.words[0]?.word || character.char
}

export function getPrimaryMeaning(character: Character): string {
  return character.words[0]?.meaning || character.funFact || character.etymology
}

export function getResultBadge(accuracy: number): { icon: string; title: string; message: string } {
  if (accuracy >= 95) {
    return { icon: '👑', title: '识字小冠军', message: '今天状态超棒，几乎关关满分！' }
  }
  if (accuracy >= 85) {
    return { icon: '🏆', title: '闯关小达人', message: '已经很厉害啦，再玩一局就更熟啦。' }
  }
  if (accuracy >= 70) {
    return { icon: '🌈', title: '进步小勇士', message: '越玩越会认，继续冲呀。' }
  }
  return { icon: '🌱', title: '识字小新星', message: '每试一次都在进步，继续加油。' }
}

export function isComposableCharacter(character: Character): boolean {
  return character.components.length >= 2
}

export function chooseDistractors(characters: Character[], answer: Character, count: number): Character[] {
  const buckets = [
    characters.filter((c) => c.id !== answer.id && c.level === answer.level && c.theme === answer.theme),
    characters.filter((c) => c.id !== answer.id && c.radical === answer.radical),
    characters.filter((c) => c.id !== answer.id && c.theme === answer.theme),
    characters.filter((c) => c.id !== answer.id && Math.abs(c.strokeCount - answer.strokeCount) <= 2),
    characters.filter((c) => c.id !== answer.id),
  ]

  const picked: Character[] = []
  const seen = new Set<number>([answer.id])

  for (const bucket of buckets) {
    for (const candidate of shuffleItems(bucket)) {
      if (picked.length >= count) break
      if (!seen.has(candidate.id)) {
        seen.add(candidate.id)
        picked.push(candidate)
      }
    }
    if (picked.length >= count) break
  }

  return picked
}

export function createChoiceRounds(characters: Character[], roundCount: number): ChoiceRound[] {
  return sampleItems(characters, Math.min(roundCount, characters.length)).map((answer) => ({
    answer,
    choices: shuffleItems([answer, ...chooseDistractors(characters, answer, 3)]),
  }))
}

export function createPuzzleRounds(characters: Character[], roundCount: number): PuzzleRound[] {
  const source = sampleItems(characters.filter(isComposableCharacter), roundCount)

  const distractorPieces = characters
    .filter((character) => character.components.length > 0)
    .flatMap((character) => character.components.map((component, index) => ({
      id: `d-${character.id}-${index}`,
      char: component.char,
      position: component.position,
      role: component.role,
      source: 'distractor' as const,
    })))

  return source.map((answer) => {
    const slots = answer.components.map((component, index) => ({
      id: `a-${answer.id}-${index}`,
      char: component.char,
      position: component.position,
      role: component.role,
      source: 'answer' as const,
    }))

    const extras = sampleItems(
      distractorPieces.filter((piece) => !slots.some((slot) => slot.char === piece.char)),
      Math.min(2, Math.max(0, 5 - slots.length)),
    )

    return {
      answer,
      slots,
      tray: shuffleItems([...slots, ...extras]),
    }
  })
}

export function createRadicalFamilies(
  characters: Character[],
  familyCount: number,
  charsPerFamily: number,
): RadicalFamily[] {
  const groups = new Map<string, Character[]>()

  for (const character of characters) {
    const group = groups.get(character.radical) || []
    group.push(character)
    groups.set(character.radical, group)
  }

  const candidates = Array.from(groups.entries())
    .map(([radical, members]) => ({
      radical,
      label: members[0]?.radicalName || `${radical}部`,
      characters: members,
    }))
    .filter((group) => group.characters.length >= charsPerFamily)

  return sampleItems(candidates, Math.min(familyCount, candidates.length)).map((group) => ({
    radical: group.radical,
    label: group.label,
    characters: sampleItems(group.characters, charsPerFamily),
  }))
}

const emojiMap: Record<string, string> = {
  '山': '⛰️', '水': '💧', '火': '🔥', '木': '🌳', '日': '☀️',
  '月': '🌙', '星': '⭐', '雨': '🌧️', '云': '☁️', '风': '💨',
  '人': '🧑', '手': '✋', '目': '👀', '口': '👄', '心': '❤️',
  '马': '🐴', '牛': '🐮', '羊': '🐑', '鸟': '🐦', '鱼': '🐟',
  '虫': '🐛', '花': '🌸', '草': '🌱', '竹': '🎋', '果': '🍎',
  '妈': '👩', '爸': '👨', '学': '📚', '休': '😴',
  '大': '🐘', '小': '🐜', '土': '🟫', '石': '🪨', '川': '🏞️',
  '田': '🌾', '女': '👧', '子': '👶', '好': '👍', '白': '⬜',
  '力': '💪', '男': '👦', '足': '🦶', '牙': '🦷', '头': '🗣️',
  '身': '🚶', '耳': '👂', '太': '☀️', '天': '🌤️', '中': '🎯',
  '本': '📕', '末': '📄', '上': '⬆️', '下': '⬇️', '一': '1️⃣',
  '二': '2️⃣', '三': '3️⃣', '从': '👥', '众': '👨‍👩‍👧‍👦',
  '尖': '📐', '尘': '💨', '林': '🌲', '森': '🏕️', '明': '💡', '看': '🔍',
  '江': '🌊', '河': '🏞️', '海': '🌊', '湖': '🏖️', '清': '💎',
  '树': '🌴', '根': '🪵', '枝': '🌿', '叶': '🍃',
  '吃': '🍽️', '喝': '🥤', '叫': '📢', '唱': '🎤', '吹': '💨',
  '打': '👊', '拍': '👏', '拉': '🤝', '抱': '🤗',
  '你': '👉', '他': '👤', '们': '👥', '过': '🚶', '远': '🔭', '近': '🏠', '进': '🚪',
  '爷': '👴', '奶': '👵', '姐': '👩', '妹': '👧', '弟': '👦',
  '伯': '👨', '叔': '🧔', '姑': '👩', '姨': '👩',
  '朋': '🤝', '友': '👫', '亲': '❤️', '爱': '💕', '家': '🏠',
  '孩': '👶', '孙': '👼', '母': '👩‍👧', '父': '👨‍👦', '儿': '🧒',
  '妇': '👩', '老': '🧓', '师': '👩‍🏫', '生': '🌱', '活': '💧',
  '姓': '📛', '名': '🏷️', '自': '🙋', '己': '🪞', '体': '🏃',
  '跑': '🏃', '跳': '🤸', '走': '🚶', '飞': '🕊️',
  '笑': '😄', '哭': '😢', '说': '🗣️', '听': '👂',
  '思': '🤔', '想': '💭', '忘': '🤷', '记': '📝', '念': '💌',
  '快': '⚡', '慢': '🐢', '忙': '🐝', '帮': '🤝', '让': '🎁',
  '拿': '✊', '放': '⬇️', '给': '🎁', '回': '↩️', '问': '❓', '答': '✅',
  '教': '📖', '习': '✍️', '练': '🎯', '写': '✏️', '画': '🎨',
  '桌': '🪑', '椅': '🪑', '床': '🛏️', '灯': '💡', '杯': '🥛',
  '碗': '🍚', '筷': '🥢', '锅': '🍲', '刀': '🔪',
  '书': '📖', '笔': '🖊️', '纸': '📄', '伞': '☂️',
  '衣': '👕', '帽': '🎩', '鞋': '👟',
  '房': '🏘️', '窗': '🪟', '门': '🚪',
  '路': '🛣️', '桥': '🌉', '船': '⛵', '车': '🚗',
  '钱': '💰', '钟': '🕐', '镜': '🪞', '药': '💊', '茶': '🍵', '饭': '🍚', '菜': '🥬',
  '美': '🌸', '善': '🤲', '真': '✅',
  '高': '🦒', '低': '📉', '深': '🌊', '强': '💪', '弱': '🐣',
  '热': '🔥', '冷': '❄️', '新': '✨', '旧': '📜',
  '对': '✅', '错': '❌', '能': '🦸', '会': '🎓',
  '可': '👍', '以': '🔧', '因': '🔗', '常': '🔄', '非': '🚫',
  '才': '🌱', '全': '💯', '正': '➡️', '永': '♾️', '直': '📏', '平': '⚖️',
  '科': '🔬', '机': '🤖', '算': '🧮', '网': '🕸️', '码': '💻',
  '史': '📜', '历': '📅', '文': '📝', '武': '🥋', '舞': '💃',
  '汉': '🀄', '国': '🇨🇳', '旗': '🚩', '龙': '🐉', '凤': '🦚',
  '岁': '🎂', '节': '🎊', '神': '✨', '京': '🏯', '华': '🏵️',
  '城': '🏰', '园': '🏡', '聪': '🦉', '梦': '💤', '色': '🎨', '世': '🌍',
  '春': '🌸', '夏': '☀️', '秋': '🍂', '冬': '⛄',
  '冰': '🧊', '雪': '❄️', '雷': '⚡', '地': '🌏', '空': '🌌',
  '金': '🥇', '玉': '💎', '泉': '⛲', '岛': '🏝️', '沙': '🏖️',
  '阳': '☀️', '虹': '🌈', '浪': '🌊',
  '松': '🌲', '梅': '🌸', '兰': '🌺', '菊': '🏵️', '荷': '🪷', '莲': '🪷',
  '桃': '🍑', '柳': '🌿', '苗': '🌱', '品': '⭐', '晶': '💎',
  '鸣': '🐦', '囚': '🔒', '泪': '💧', '灾': '🔥', '安': '🛡️',
  '间': '⏱️', '早': '🌅', '香': '🌺', '坐': '🪑', '立': '🧍',
  '光': '💡', '音': '🎵', '乐': '🎶', '多': '📊', '少': '📉',
  '分': '✂️', '电': '⚡', '米': '🍚', '瓜': '🍉', '长': '📏', '气': '💨',
  '万': '🔢', '青': '💚',
}

export function getFallbackEmoji(character: Character): string {
  if (emojiMap[character.char]) return emojiMap[character.char]

  const themeIcons: Record<string, string> = {
    '自然': '🌿', '身体': '🧍', '家庭': '👨‍👩‍👧', '动作': '🏃',
    '器物': '🔧', '抽象': '💭', '科技': '💻', '历史': '📜', '生活': '🏠',
    '社会': '👥',
  }
  const constructIcons: Record<string, string> = {
    '象形': '🖼️', '指事': '☝️', '会意': '🧩', '形声': '🔤',
  }

  return themeIcons[character.theme] || constructIcons[character.constructionType] || '🀄'
}
