import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Character } from '@/types'

interface Props {
  character: Character
}

const strokeNames: Record<string, string[]> = {
  '一': ['横'], '二': ['横', '横'], '三': ['横', '横', '横'], '八': ['撇', '捺'],
  '上': ['竖', '横', '横'], '下': ['横', '竖', '点'],
  '日': ['竖', '横折', '横', '横'], '月': ['撇', '横折钩', '横', '横'],
  '山': ['竖', '竖折', '竖'], '水': ['竖钩', '横撇', '撇', '捺'],
  '火': ['点', '撇', '撇', '捺'], '人': ['撇', '捺'],
  '土': ['横', '竖', '横'], '石': ['横', '撇', '竖', '横折', '横'],
  '川': ['撇', '竖', '竖'], '田': ['竖', '横折', '横', '竖', '横'],
  '木': ['横', '竖', '撇', '捺'], '马': ['横折', '竖折折钩', '横'],
  '牛': ['撇', '横', '横', '竖'], '羊': ['点', '撇', '横', '横', '横', '竖'],
  '虫': ['竖', '横折', '横', '竖', '横', '点'],
  '大': ['横', '撇', '捺'], '小': ['竖钩', '点', '点'],
  '目': ['竖', '横折', '横', '横', '横'], '口': ['竖', '横折', '横'],
  '手': ['撇', '横', '横', '竖钩'], '耳': ['横', '竖', '竖', '横', '横', '横'],
  '心': ['点', '卧钩', '点', '点'], '力': ['横折钩', '撇'],
  '足': ['竖', '横折', '横', '竖', '横', '撇', '捺'],
  '牙': ['横', '撇折', '竖钩', '撇'], '头': ['点', '点', '横', '撇', '点'],
  '身': ['撇', '竖', '横折', '横', '横', '横', '撇'],
  '女': ['撇点', '撇', '横'], '子': ['横折', '竖钩', '横'],
  '中': ['竖', '横折', '横', '竖'], '本': ['横', '竖', '撇', '捺', '横'],
  '末': ['横', '横', '竖', '撇', '捺'], '太': ['横', '撇', '捺', '点'],
  '天': ['横', '横', '撇', '捺'], '白': ['撇', '竖', '横折', '横', '横'],
  '云': ['横', '横', '撇折', '点'], '风': ['撇', '横折钩', '撇', '点'],
  '雨': ['横', '竖', '横折钩', '竖', '点', '点', '点', '点'],
  '电': ['竖', '横折', '横', '横', '竖弯钩'],
  '车': ['横', '撇折', '横', '竖'], '门': ['点', '竖', '横折钩'],
  '米': ['点', '撇', '横', '竖', '撇', '捺'], '长': ['撇', '横', '竖提', '捺'],
  '万': ['横', '横折钩', '撇'],
  '花': ['横', '竖', '竖', '撇', '竖', '撇', '竖弯钩'],
  '草': ['横', '竖', '竖', '竖', '横折', '横', '横', '横', '竖'],
  '竹': ['撇', '横', '竖', '撇', '横', '竖钩'],
  '果': ['竖', '横折', '横', '横', '横', '竖', '撇', '捺'],
  '瓜': ['撇', '撇', '竖提', '点', '捺'],
  '从': ['撇', '点', '撇', '捺'], '众': ['撇', '捺', '撇', '捺', '撇', '捺'],
  '休': ['撇', '竖', '横', '竖', '撇', '捺'],
  '明': ['竖', '横折', '横', '横', '撇', '横折钩', '横', '横'],
  '好': ['撇点', '撇', '横', '横折', '竖钩', '横'],
  '看': ['撇', '横', '横', '撇', '竖', '横折', '横', '横', '横'],
  '妈': ['撇点', '撇', '横', '横折', '竖折折钩', '横'],
  '爸': ['撇', '点', '撇', '捺', '横折', '竖', '横', '竖弯钩'],
  '学': ['点', '点', '撇', '点', '横撇', '横折钩', '竖弯钩', '横'],
  '春': ['横', '横', '横', '撇', '捺', '竖', '横折', '横', '横'],
  '你': ['撇', '竖', '撇', '横撇', '竖钩', '点', '点'],
  '他': ['撇', '竖', '横折钩', '竖', '竖弯钩'],
}

function getStrokes(character: Character): string[] {
  if (character.strokes && character.strokes.length > 0) return character.strokes
  if (strokeNames[character.char]) return strokeNames[character.char]
  return Array.from({ length: character.strokeCount }, (_, i) => `第${i + 1}笔`)
}

function getStrokeLabel(name: string, index: number): string {
  if (/^第\d+笔$/.test(name)) return name
  return `第${index + 1}笔 ${name}`
}

function buildFallbackNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `第${i + 1}笔`)
}

export default function StrokePlayer({ character }: Props) {
  const outlineContainerRef = useRef<HTMLDivElement>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)
  const outlineWriterRef = useRef<any>(null)
  const mainWriterRef = useRef<any>(null)
  const initPromiseRef = useRef<Promise<any> | null>(null)
  const playTokenRef = useRef(0)
  const [completedStrokes, setCompletedStrokes] = useState(0)
  const [activeStroke, setActiveStroke] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [resolvedStrokeCount, setResolvedStrokeCount] = useState<number | null>(null)

  const names = resolvedStrokeCount !== null
    ? (character.strokes && character.strokes.length === resolvedStrokeCount
        ? character.strokes
        : strokeNames[character.char] && strokeNames[character.char].length === resolvedStrokeCount
          ? strokeNames[character.char]
          : buildFallbackNames(resolvedStrokeCount))
    : getStrokes(character)
  const gridColorMain = isPlaying ? '#dbe3ef' : '#cbd5e1'
  const gridColorDiag = isPlaying ? '#e5eaf2' : '#d1d5db'
  const gridFrameWidth = isPlaying ? 1 : 1.2
  const gridLineWidth = isPlaying ? 0.9 : 1

  const destroyWriters = useCallback(() => {
    if (outlineWriterRef.current) {
      try { outlineWriterRef.current.cancel() } catch {}
      outlineWriterRef.current = null
    }
    if (mainWriterRef.current) {
      try { mainWriterRef.current.cancel() } catch {}
      mainWriterRef.current = null
    }
    if (outlineContainerRef.current) outlineContainerRef.current.innerHTML = ''
    if (mainContainerRef.current) mainContainerRef.current.innerHTML = ''
  }, [])

  const animateStroke = useCallback((writer: any, index: number, speed = 2) => {
    return new Promise<void>((resolve) => {
      writer.animateStroke(index, {
        speed,
        onComplete: () => resolve(),
      })
    })
  }, [])

  const initWriters = useCallback(async (char: string) => {
    if (!outlineContainerRef.current || !mainContainerRef.current) return null
    destroyWriters()
    setCompletedStrokes(0)
    setActiveStroke(null)
    setResolvedStrokeCount(null)

    const HanziWriter = (await import('hanzi-writer')).default
    const sharedOptions = {
      width: 200,
      height: 200,
      padding: 15,
      delayBetweenStrokes: 0,
    }

    outlineWriterRef.current = HanziWriter.create(outlineContainerRef.current, char, {
      ...sharedOptions,
      showCharacter: false,
      showOutline: true,
      outlineColor: '#cbd5e1',
      strokeColor: 'rgba(0, 0, 0, 0)',
      highlightColor: 'rgba(0, 0, 0, 0)',
    })

    mainWriterRef.current = HanziWriter.create(mainContainerRef.current, char, {
      ...sharedOptions,
      showCharacter: false,
      showOutline: false,
      strokeColor: '#1f2937',
      highlightColor: '#4DABF7',
      strokeAnimationSpeed: 2,
    })

    try {
      const charData = await mainWriterRef.current.getCharacterData()
      if (Array.isArray(charData?.strokes)) {
        setResolvedStrokeCount(charData.strokes.length)
      }
    } catch {
      setResolvedStrokeCount(null)
    }

    return mainWriterRef.current
  }, [destroyWriters])

  const ensureMainWriter = useCallback(async () => {
    if (mainWriterRef.current) return mainWriterRef.current
    if (!initPromiseRef.current) {
      initPromiseRef.current = initWriters(character.char)
    }
    const writer = await initPromiseRef.current
    return writer
  }, [character.char, initWriters])

  const rebuildTo = useCallback(async (count: number) => {
    const writer = await initWriters(character.char)
    if (!writer || count <= 0) return

    for (let i = 0; i < count; i++) {
      await animateStroke(writer, i, 5)
      setCompletedStrokes(i + 1)
    }
  }, [animateStroke, character.char, initWriters])

  const performReset = useCallback(async (char: string) => {
    playTokenRef.current += 1
    setIsPlaying(false)
    setActiveStroke(null)
    initPromiseRef.current = initWriters(char)
    await initPromiseRef.current
  }, [initWriters])

  useEffect(() => {
    // Entering a new character/stroke view triggers one automatic reset,
    // so the first manual play always starts from a clean initial state.
    void performReset(character.char)
    return () => {
      playTokenRef.current += 1
      initPromiseRef.current = null
      destroyWriters()
    }
  }, [character.char, destroyWriters, performReset])

  const animateFull = async () => {
    const writer = await ensureMainWriter()
    if (!writer || isPlaying || completedStrokes >= names.length) return

    const token = playTokenRef.current + 1
    playTokenRef.current = token
    setIsPlaying(true)

    for (let i = completedStrokes; i < names.length; i++) {
      if (playTokenRef.current !== token) break
      setActiveStroke(i)
      await animateStroke(writer, i, 2)
      if (playTokenRef.current !== token) break
      setCompletedStrokes(i + 1)
      if (i < names.length - 1) {
        await new Promise((r) => setTimeout(r, 500))
      }
    }

    setActiveStroke(null)
    setIsPlaying(false)
  }

  const nextStroke = async () => {
    const writer = await ensureMainWriter()
    if (!writer || isPlaying || completedStrokes >= names.length) return

    playTokenRef.current += 1
    setActiveStroke(completedStrokes)
    await animateStroke(writer, completedStrokes, 2)
    setCompletedStrokes((prev) => prev + 1)
    setActiveStroke(null)
  }

  const previousStroke = async () => {
    if (isPlaying || completedStrokes <= 0) return

    playTokenRef.current += 1
    setActiveStroke(null)
    await rebuildTo(completedStrokes - 1)
  }

  const reset = async () => {
    await performReset(character.char)
  }

  const playOrReplay = async () => {
    if (completedStrokes >= names.length) {
      await reset()
    }
    await animateFull()
  }

  return (
    <div className="text-center flex flex-col items-center">
      <div className="bg-gray-50 rounded-2xl mb-4 w-full min-h-[240px] flex items-center justify-center relative overflow-hidden">
        <div className="relative" style={{ width: 200, height: 200 }}>
          <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 200 200" aria-hidden="true">
            <rect x="1" y="1" width="198" height="198" rx="12" fill="none" stroke={gridColorMain} strokeDasharray="5 5" strokeWidth={gridFrameWidth} style={{ transition: 'stroke 180ms ease, stroke-width 180ms ease' }} />
            <line x1="100" y1="0" x2="100" y2="200" stroke={gridColorMain} strokeDasharray="4 4" strokeWidth={gridLineWidth} style={{ transition: 'stroke 180ms ease, stroke-width 180ms ease' }} />
            <line x1="0" y1="100" x2="200" y2="100" stroke={gridColorMain} strokeDasharray="4 4" strokeWidth={gridLineWidth} style={{ transition: 'stroke 180ms ease, stroke-width 180ms ease' }} />
            <line x1="0" y1="0" x2="200" y2="200" stroke={gridColorDiag} strokeDasharray="4 4" strokeWidth={gridLineWidth} style={{ transition: 'stroke 180ms ease, stroke-width 180ms ease' }} />
            <line x1="200" y1="0" x2="0" y2="200" stroke={gridColorDiag} strokeDasharray="4 4" strokeWidth={gridLineWidth} style={{ transition: 'stroke 180ms ease, stroke-width 180ms ease' }} />
          </svg>
          <div ref={outlineContainerRef} className="absolute inset-0" style={{ width: 200, height: 200, overflow: 'hidden' }} />
          <div ref={mainContainerRef} className="absolute inset-0" style={{ width: 200, height: 200, overflow: 'hidden' }} />
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mb-4">
        {names.map((name, i) => (
          <motion.div
            key={i}
            className={`px-1.5 py-1 rounded-lg flex items-center justify-center text-[10px] font-bold leading-tight transition-all min-w-[36px] ${
              i < completedStrokes
                ? 'bg-kid-blue text-white shadow-md'
                : 'bg-gray-100 text-gray-400'
            } ${
              activeStroke === i
                ? 'ring-2 ring-kid-blue/35 shadow-lg'
                : ''
            }`}
            animate={
              activeStroke === i
                ? { scale: [1, 1.08, 1], opacity: [1, 0.88, 1] }
                : i === completedStrokes - 1
                  ? { scale: [1, 1.15, 1] }
                  : {}
            }
          >
            {getStrokeLabel(name, i)}
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <button onClick={playOrReplay} disabled={isPlaying} className="btn-primary text-sm px-5 py-2">
          {isPlaying ? '⏳ 播放中...' : '▶️ 播放笔顺'}
        </button>
        <button onClick={previousStroke} disabled={isPlaying || completedStrokes <= 0} className="btn-kid bg-gray-200 text-gray-600 text-sm px-4 py-2 disabled:opacity-50">
          ⬅️ 上一笔
        </button>
        <button onClick={nextStroke} disabled={isPlaying || completedStrokes >= names.length} className="btn-kid bg-gray-200 text-gray-600 text-sm px-4 py-2 disabled:opacity-50">
          ➡️ 下一笔
        </button>
        <button onClick={reset} className="btn-kid bg-gray-200 text-gray-600 text-sm px-5 py-2">
          🔄 重置
        </button>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        共 {names.length} 笔
        {completedStrokes > 0 && ` | ${getStrokeLabel(names[completedStrokes - 1] || '', completedStrokes - 1)}`}
      </p>
    </div>
  )
}
