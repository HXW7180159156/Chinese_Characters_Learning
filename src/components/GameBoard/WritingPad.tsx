import { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Character } from '@/types'
import { getLoadedAllCharacters } from '@data/index'

interface GameProps {
  onDone?: () => void
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

export function WritingPad({ onDone }: GameProps) {
  const [current, setCurrent] = useState<Character>(() => getRandomChar())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [score, setScore] = useState(0)
  const [strokeIndex, setStrokeIndex] = useState(0)
  const [resolvedStrokeCount, setResolvedStrokeCount] = useState<number | null>(null)
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
        setScore((s) => s + 5)
        setTimeout(() => {
          setCurrent(getRandomChar())
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
    handleNext()
    clearCanvas()
  }

  return (
    <div className="card-kid p-6 max-w-md mx-auto">
      <div className="text-center mb-3">
        <div className="text-kid-purple font-bold text-lg mb-1">✏️ 描红工坊</div>
        <div className="text-3xl font-extrabold text-gray-700 mb-1">{current.char}</div>
        <div className="text-sm text-gray-400">
          部首：{current.radical} | {displayStrokeCount}画
          {strokes.length > 0 && ` | 当前第 ${strokeIndex + 1} 笔：${strokes[strokeIndex]}`}
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
      </div>
    </div>
  )
}
