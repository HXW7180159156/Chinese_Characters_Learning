import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Character } from '@/types'
import { getLoadedAllCharacters } from '@data/index'

function getRandomChars(count: number): Character[] {
  const all = getLoadedAllCharacters()
  if (all.length === 0) return []
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

interface GameProps {
  onDone?: () => void
}

/* ====== 1. 字形拼图 PuzzleGame ====== */
const composableChars = getLoadedAllCharacters().filter((c) => c.components.length > 0)

export function PuzzleGame({ onDone }: GameProps) {
  const [current, setCurrent] = useState(() => composableChars[Math.floor(Math.random() * composableChars.length)] || getRandomChars(1)[0])
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [score, setScore] = useState(0)

  const parts = current.components.map((c) => c.char)
  const shuffled = [...parts].sort(() => Math.random() - 0.5)

  const nextChar = () => {
    const next = composableChars[Math.floor(Math.random() * composableChars.length)]
    if (next) setCurrent(next)
  }

  const handleSelect = (part: string) => {
    const next = [...selected, part]
    setSelected(next)
    if (next.join('') === parts.join('')) {
      setMessage('🎉 太棒了！拼对啦！')
      setScore((s) => s + 10)
      setTimeout(() => {
        nextChar()
        setSelected([])
        setMessage('')
      }, 1500)
    } else if (next.length === parts.length) {
      setMessage('🤔 再试试哦~')
      setTimeout(() => {
        setSelected([])
        setMessage('')
      }, 1000)
    }
  }

  return (
    <div className="card-kid p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-kid-blue font-bold text-lg mb-1">🧩 字形拼图</div>
        <div className="text-sm text-gray-400">把部件拼成：</div>
        <div className="text-6xl font-bold text-gray-800 my-3">{current.char}</div>
        <div className="text-kid-red">{current.pinyin}</div>
        <div className="text-xs text-gray-400 mt-1">
          拖选顺序：{parts.join(' + ')}
        </div>
      </div>

      <div className="flex justify-center gap-3 mb-4">
        {shuffled.map((part, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleSelect(part)}
            disabled={selected.includes(part)}
            className={`w-16 h-16 rounded-2xl text-2xl font-bold shadow-md transition-all ${
              selected.includes(part)
                ? 'bg-gray-200 text-gray-300 cursor-not-allowed'
                : 'bg-kid-yellow text-gray-800 hover:bg-kid-orange hover:text-white'
            }`}
          >
            {part}
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center gap-2 mb-4 min-h-[40px]">
        {parts.map((_, i) => (
          <div
            key={i}
            className={`w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center text-xl font-bold transition-all ${
              selected[i]
                ? 'border-kid-green bg-kid-green/10 text-kid-green'
                : 'border-gray-200 text-gray-300'
            }`}
          >
            {selected[i] || '?'}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-center text-lg font-bold text-kid-green"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-3">
        <span className="text-kid-orange font-bold">⭐ {score} 分</span>
        <button onClick={onDone} className="ml-4 text-sm text-gray-400 underline">
          退出
        </button>
      </div>
    </div>
  )
}

/* ====== 2. 部首归类 SortGame ====== */
const radicalGroups: Record<string, string> = {
  '氵': 'water', '木': 'tree', '口': 'mouth', '女': 'female',
  '扌': 'hand', '亻': 'person', '艹': 'grass', '火': 'fire',
}

export function SortGame({ onDone }: GameProps) {
  const [score, setScore] = useState(0)
  const [dragged, setDragged] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, string[]>>({})

  const radicalKeys = Object.keys(radicalGroups).slice(0, 3)
  const chars = getLoadedAllCharacters()
    .filter((c) => radicalKeys.includes(c.radical))
    .slice(0, 6)
    .sort(() => Math.random() - 0.5)

  const handleDrop = (radical: string, char: string) => {
    const match = getLoadedAllCharacters().find((c) => c.char === char)
    if (match && match.radical === radical) {
      setMatches((m) => ({
        ...m,
        [radical]: [...(m[radical] || []), char],
      }))
      setScore((s) => s + 5)
      setDragged(null)
    }
  }

  const remaining = chars.filter(
    (c) => !Object.values(matches).flat().includes(c.char)
  )

  return (
    <div className="card-kid p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-kid-green font-bold text-lg mb-1">🏘️ 部首家族</div>
        <div className="text-sm text-gray-400">把汉字拖到对应的部首家</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {radicalKeys.map((radical) => (
          <div
            key={radical}
            className="bg-kid-bg rounded-2xl p-3 min-h-[80px] text-center border-2 border-dashed border-gray-200 hover:border-kid-green transition-colors"
            onDragOver={((e: React.DragEvent) => e.preventDefault()) as any}
            onDrop={((e: React.DragEvent) => {
              e.preventDefault()
              const char = e.dataTransfer.getData('text')
              handleDrop(radical, char)
            }) as any}
          >
            <div className="text-2xl font-bold text-kid-blue">{radical}</div>
            <div className="text-xs text-gray-400 mb-2">部首</div>
            {(matches[radical] || []).map((c, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="inline-block text-xl font-bold mx-0.5 px-1 bg-white rounded-lg"
              >
                {c}
              </motion.span>
            ))}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {remaining.map((c, i) => (
          <motion.button
            key={i}
            draggable
            onDragStart={((e: React.DragEvent<HTMLButtonElement>) => {
              e.dataTransfer.setData('text', c.char)
            }) as any}
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 rounded-xl bg-white shadow-md text-2xl font-bold hover:bg-kid-yellow/20 transition-colors cursor-grab active:cursor-grabbing"
          >
            {c.char}
          </motion.button>
        ))}
        {remaining.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-kid-green font-bold text-lg"
          >
            🎉 全部归位！太厉害了！
          </motion.div>
        )}
      </div>

      <div className="text-center mt-4">
        <span className="text-kid-orange font-bold">⭐ {score} 分</span>
        <button onClick={onDone} className="ml-4 text-sm text-gray-400 underline">
          退出
        </button>
      </div>
    </div>
  )
}

/* ====== 3. 看图选字 MatchGame ====== */
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
  '尖': '📐', '尘': '💨',
  '林': '🌲', '森': '🏕️', '明': '💡', '看': '🔍',
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

function getFallbackEmoji(c: Character): string {
  if (emojiMap[c.char]) return emojiMap[c.char]
  const themeIcons: Record<string, string> = {
    '自然': '🌿', '身体': '🧍', '家庭': '👨‍👩‍👧', '动作': '🏃',
    '器物': '🔧', '抽象': '💭', '科技': '💻', '历史': '📜', '生活': '🏠',
    '社会': '👥',
  }
  const constructIcons: Record<string, string> = {
    '象形': '🖼️', '指事': '☝️', '会意': '🧩', '形声': '🔤',
  }
  return themeIcons[c.theme] || constructIcons[c.constructionType] || '🀄'
}

export function MatchGame({ onDone }: GameProps) {
  const [chars] = useState(() => {
    const all = getLoadedAllCharacters().filter((c) => c.components.length === 0 || emojiMap[c.char])
    const shuffled = [...all].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 5)
  })

  if (chars.length === 0) {
    return (
      <div className="card-kid p-6 max-w-md mx-auto text-center">
        <div className="text-6xl mb-3">📚</div>
        <div className="text-xl font-bold text-kid-green mb-2">数据加载中</div>
        <div className="text-kid-orange font-bold text-lg mb-4">请先完成 Level 1 学习</div>
        <button onClick={onDone} className="btn-primary">返回</button>
      </div>
    )
  }

  const charsRef = chars
  return <MatchGameInner chars={charsRef} onDone={onDone || (() => {})} />
}

function MatchGameInner({ chars, onDone }: { chars: Character[]; onDone: () => void }) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')

  const answer = chars[round]
  const distractors = useMemo(() => {
    return getLoadedAllCharacters()
      .filter((c) => c.id !== answer?.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
  }, [answer?.id])
  const choices = useMemo(() => {
    if (!answer) return []
    return [answer, ...distractors].sort(() => Math.random() - 0.5)
  }, [answer, distractors])

  const handlePick = (choice: Character) => {
    if (choice.id === answer.id) {
      setFeedback('🎉 对了！')
      setScore((s) => s + 10)
      setTimeout(() => {
        if (round < chars.length - 1) {
          setRound((r) => r + 1)
          setFeedback('')
        } else {
          setFeedback('🏆 全部答对！')
        }
      }, 800)
    } else {
      setFeedback('😅 再试试~')
      setTimeout(() => setFeedback(''), 600)
    }
  }

  if (!answer || round >= chars.length) {
    return (
      <div className="card-kid p-6 max-w-md mx-auto text-center">
        <div className="text-6xl mb-3">🏆</div>
        <div className="text-xl font-bold text-kid-green mb-2">游戏完成！</div>
        <div className="text-kid-orange font-bold text-lg mb-4">⭐ {score} 分</div>
        <button
          onClick={onDone}
          className="btn-primary"
        >
          再来一局
        </button>
      </div>
    )
  }

  return (
    <div className="card-kid p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-kid-blue font-bold text-lg mb-1">🖼️ 看图识画</div>
        <div className="text-sm text-gray-400">看图画，选对的汉字</div>
        <div className="text-8xl my-4">{answer ? getFallbackEmoji(answer) : '❓'}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePick(choice)}
            className="bg-white shadow-md rounded-2xl p-4 text-center hover:bg-kid-yellow/20 transition-colors"
          >
            <div className="text-3xl font-bold">{choice.char}</div>
            <div className="text-xs text-gray-400">{choice.pinyin}</div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0 }}
            className="text-center text-lg font-bold mt-3 text-kid-green"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-3">
        <span className="text-kid-orange font-bold">⭐ {score} 分</span>
        <span className="ml-4 text-sm text-gray-300">{round + 1}/{chars.length}</span>
        <button onClick={onDone} className="ml-4 text-sm text-gray-400 underline">
          退出
        </button>
      </div>
    </div>
  )
}

/* ====== 5. 听音找字 ListenGame ====== */
export function ListenGame({ onDone }: GameProps) {
  const [round, setRound] = useState(0)
  const [score, setScore] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [showPinyin, setShowPinyin] = useState(false)

  const chars = getRandomChars(5)
  const answer = chars[round]
  const options = getRandomChars(5).filter((c) => c.id !== answer?.id).slice(0, 3)
  const choices = answer ? [answer, ...options].sort(() => Math.random() - 0.5) : []

  const handlePick = (choice: Character) => {
    if (!answer) return
    if (choice.id === answer.id) {
      setFeedback('🎉 答对啦！')
      setScore((s) => s + 10)
      setTimeout(() => {
        if (round < chars.length - 1) {
          setRound((r) => r + 1)
          setShowPinyin(false)
          setFeedback('')
        } else {
          setFeedback('🏆 听力小达人！')
        }
      }, 800)
    } else {
      setFeedback('😅 再听听看~')
      setTimeout(() => setFeedback(''), 600)
    }
  }

  if (!answer || round >= chars.length) {
    return (
      <div className="card-kid p-6 max-w-md mx-auto text-center">
        <div className="text-6xl mb-3">🏆</div>
        <div className="text-xl font-bold text-kid-green mb-2">游戏完成！</div>
        <div className="text-kid-orange font-bold text-lg mb-4">⭐ {score} 分</div>
        <button onClick={onDone} className="btn-primary">再来一局</button>
      </div>
    )
  }

  return (
    <div className="card-kid p-6 max-w-md mx-auto">
      <div className="text-center mb-4">
        <div className="text-kid-yellow font-bold text-lg mb-1">👂 听音找字</div>
        <div className="text-sm text-gray-400 mb-3">听读音，选出正确的汉字</div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setShowPinyin(true)
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(answer.char)
              utterance.lang = 'zh-CN'
              utterance.rate = 0.8
              speechSynthesis.speak(utterance)
            }
          }}
          className="w-20 h-20 rounded-full bg-kid-yellow shadow-lg flex items-center justify-center text-3xl mb-2 hover:bg-kid-orange transition-colors"
        >
          🔊
        </motion.button>
        <div className="text-xs text-gray-400">点击喇叭听读音</div>

        {showPinyin && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-kid-red font-bold text-lg"
          >
            {answer.pinyin}
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {choices.map((choice, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePick(choice)}
            className="bg-white shadow-md rounded-2xl p-4 text-center hover:bg-kid-yellow/10 transition-colors"
          >
            <div className="text-3xl font-bold">{choice.char}</div>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="text-center text-lg font-bold mt-3 text-kid-green"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="text-center mt-3">
        <span className="text-kid-orange font-bold">⭐ {score} 分</span>
        <span className="ml-4 text-sm text-gray-300">{round + 1}/{chars.length}</span>
        <button onClick={onDone} className="ml-4 text-sm text-gray-400 underline">退出</button>
      </div>
    </div>
  )
}
