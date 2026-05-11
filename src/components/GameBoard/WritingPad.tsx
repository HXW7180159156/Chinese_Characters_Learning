import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Character } from '@/types'
import { getLoadedAllCharacters } from '@data/index'
import type { PracticeDifficulty } from '@/services/practiceCenter'

interface GameProps {
  onDone?: () => void
  difficulty?: PracticeDifficulty
}

function getRandomChar(): Character {
  const all = getLoadedAllCharacters()
  if (all.length === 0) {
    return {
      id: 0, char: '人', pinyin: 'rén', tone: 2, radical: '人', radicalName: '人字旁',
      strokeCount: 2, strokes: ['撇', '捺'], constructionType: '象形', components: [],
      etymology: '', imagePrompt: '', theme: '身体', level: 1,
      words: [], sentence: '', funFact: '', tags: [],
    }
  }
  return all[Math.floor(Math.random() * all.length)]
}

function getNextWritingChar(mode: 'easy' | 'challenge'): Character {
  const all = getLoadedAllCharacters()
  if (all.length === 0) return getRandomChar()

  const filtered = all.filter((char) => {
    if (mode === 'easy') return char.strokeCount <= 6
    return char.strokeCount >= 7
  })

  const source = filtered.length > 0 ? filtered : all
  return source[Math.floor(Math.random() * source.length)]
}

export function WritingPad({ onDone, difficulty }: GameProps) {
  const initialMode = difficulty?.writingMode === 'challenge'
    ? 'challenge'
    : difficulty?.writingMode === 'mixed'
      ? 'easy'
      : 'easy'
  const [mode, setMode] = useState<'easy' | 'challenge'>(initialMode)
  const [current, setCurrent] = useState<Character>(() => getNextWritingChar('easy'))
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [score, setScore] = useState(0)
  const [strokeIndex, setStrokeIndex] = useState(0)
  const [resolvedStrokeCount, setResolvedStrokeCount] = useState<number | null>(null)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState('')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const displayStrokeCount = resolvedStrokeCount ?? current.strokeCount

  const strokes = current.strokes?.length
    ? current.strokes
    : displayStrokeCount <= 6
      ? Array.from({ length: displayStrokeCount }, (_, i) => `第${i + 1}笔`)
      : []

  useEffect(() => {
    let cancelled = false

    async function loadStrokeCount() {
      setResolvedStrokeCount(null)
      try {
        const HanziWriter = (await import('hanzi-writer')).default
        const writer = HanziWriter.create(document.createElement('div'), current.char, {
          width: 1,
          height: 1,
          padding: 0,
          showCharacter: false,
          showOutline: false,
        })
        const charData = await writer.getCharacterData()
        if (!cancelled && Array.isArray(charData?.strokes)) {
          setResolvedStrokeCount(charData.strokes.length)
        }
      } catch {
        if (!cancelled) setResolvedStrokeCount(null)
      }
    }

    void loadStrokeCount()
    return () => {
      cancelled = true
    }
  }, [current.char])

  useEffect(() => {
    setStrokeIndex(0)
    drawGuide()
  }, [current.char])

  useEffect(() => {
    setCurrent(getNextWritingChar(mode))
    setFeedback(mode === 'easy' ? '先从 6 画以内的字开始热身。' : '挑战更复杂的汉字，试试看！')
  }, [mode])

  useEffect(() => {
    if (difficulty?.writingMode === 'challenge') {
      setMode('challenge')
    } else {
      setMode('easy')
    }
  }, [difficulty?.writingMode])

  const drawGuide = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.min(canvas.width, canvas.height)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.font = `${size * 0.7}px "KaiTi", "STKaiti", "PingFang SC", "Microsoft YaHei", serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#e5e7eb'
    ctx.fillText(current.char, canvas.width / 2, canvas.height / 2)

    if (strokes.length > 0) {
      ctx.font = `${size * 0.1}px "Nunito", sans-serif`
      ctx.fillStyle = '#9ca3af'
      ctx.fillText(`${strokeIndex + 1}/${strokes.length}`, canvas.width * 0.85, canvas.height * 0.15)
    }
  }, [current.char, strokeIndex, strokes.length])

  const getPos = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const pos = getPos(e)
    if (!pos || !lastPos.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#4DABF7'
    ctx.lineWidth = 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }

  const endDraw = () => {
    setIsDrawing(false)
    lastPos.current = null
  }

  const clearCanvas = () => {
    drawGuide()
  }

  const handleNext = () => {
    setStrokeIndex((i) => {
      const next = i + 1
      if (next >= strokes.length) {
        setScore((s) => s + 5 + Math.min(6, streak * 2))
        setStreak((value) => value + 1)
        setFeedback('🎉 这个字完成啦，继续写下一个！')
        setTimeout(() => {
          setCurrent(getNextWritingChar(mode))
          setFeedback('')
        }, 400)
        return 0
      }
      setScore((s) => s + 1)
      return next
    })
    lastPos.current = null
  }

  const handleDoneStroke = () => {
    setScore((s) => s + 3)
    setFeedback('✅ 这一笔完成啦！')
    handleNext()
    clearCanvas()
  }

  return (
    <div className="card-kid p-6 max-w-md mx-auto">
      <div className="text-center mb-3">
        <div className="text-kid-purple font-bold text-lg mb-1">✏️ 描红工坊</div>
        <div className="flex justify-center gap-2 mb-3">
          <button
            onClick={() => setMode('easy')}
            className={`px-4 py-1 rounded-full text-sm font-bold transition-colors ${
              mode === 'easy' ? 'bg-kid-green text-white' : 'bg-kid-green/10 text-kid-green'
            }`}
          >
            轻松练
          </button>
          <button
            onClick={() => setMode('challenge')}
            className={`px-4 py-1 rounded-full text-sm font-bold transition-colors ${
              mode === 'challenge' ? 'bg-kid-purple text-white' : 'bg-kid-purple/10 text-kid-purple'
            }`}
          >
            挑战练
          </button>
        </div>
        <div className="text-3xl font-extrabold text-gray-700 mb-1">{current.char}</div>
        <div className="text-sm text-gray-400">
          部首：{current.radical} | {displayStrokeCount}画
          {strokes.length > 0 && ` | 当前第 ${strokeIndex + 1} 笔：${strokes[strokeIndex]}`}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          词语提示：{current.words[0]?.word || current.char} | 主题：{current.theme}
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-kid-purple/30 mb-4 relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={240}
          className="w-full h-[200px] touch-none cursor-crosshair rounded-2xl"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      <div className="flex justify-center gap-2 mb-3 flex-wrap">
        <button
          onClick={handleDoneStroke}
          className="btn-primary text-sm px-4 py-2"
        >
          ✓ 完成此笔
        </button>
        <button
          onClick={clearCanvas}
          className="btn-kid bg-gray-200 text-gray-600 text-sm px-4 py-2"
        >
          🧹 清除
        </button>
        <button
          onClick={handleNext}
          className="btn-kid bg-kid-yellow/20 text-kid-orange text-sm px-4 py-2"
        >
          跳过 →
        </button>
        <button
          onClick={onDone}
          className="btn-kid bg-gray-100 text-gray-400 text-sm px-4 py-2"
        >
          退出
        </button>
      </div>

      <div className="text-center">
        <motion.span
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-kid-orange font-bold text-lg"
        >
          ⭐ {score} 分
        </motion.span>
        <div className="text-sm text-kid-green font-bold mt-2">🔥 连写 {streak} 个字</div>
        <div className="text-xs text-gray-400 mt-1 min-h-[20px]">{feedback || '跟着笔画顺序慢慢写，写完一个字就能闯下一关。'}</div>
      </div>
    </div>
  )
}
