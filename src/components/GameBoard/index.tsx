import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Character } from '@/types'
import { useAllCharacters } from '@/hooks/useCharacterData'
import { useGameReward } from './useGameReward'
import {
  filterCharactersForPractice,
  getPracticeDifficulty,
  type PracticeDifficulty,
  type PracticeSettings,
} from '@/services/practiceCenter'
import {
  buildSentenceHint,
  createChoiceRounds,
  createPuzzleRounds,
  createRadicalFamilies,
  getDisplayWord,
  getFallbackEmoji,
  getPrimaryMeaning,
  getResultBadge,
  praiseMessages,
  randomMessage,
  retryMessages,
  shuffleItems,
  type ChoiceRound,
  type PuzzlePiece,
  type PuzzleRound,
  type RadicalFamily,
} from './gameUtils'

interface GameProps {
  onDone?: () => void
  practiceSettings?: PracticeSettings
}

interface GameShellProps {
  title: string
  subtitle: string
  score: number
  streak?: number
  round?: number
  totalRounds?: number
  badge?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

function GameShell({ title, subtitle, score, streak = 0, round, totalRounds, badge, children, footer }: GameShellProps) {
  return (
    <div className="card-kid p-6 max-w-md mx-auto relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-kid-yellow via-kid-orange to-kid-pink" />
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="text-gray-800 font-extrabold text-xl">{title}</div>
          <div className="text-sm text-gray-400">{subtitle}</div>
        </div>
        {badge && (
          <div className="rounded-full bg-kid-yellow/20 text-kid-orange px-3 py-1 text-xs font-bold">
            {badge}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-5 text-center">
        <div className="rounded-2xl bg-kid-bg p-3">
          <div className="text-xs text-gray-400 mb-1">积分</div>
          <div className="text-lg font-extrabold text-kid-orange">⭐ {score}</div>
        </div>
        <div className="rounded-2xl bg-kid-bg p-3">
          <div className="text-xs text-gray-400 mb-1">连对</div>
          <div className="text-lg font-extrabold text-kid-green">🔥 {streak}</div>
        </div>
        <div className="rounded-2xl bg-kid-bg p-3">
          <div className="text-xs text-gray-400 mb-1">进度</div>
          <div className="text-lg font-extrabold text-kid-blue">{round && totalRounds ? `${round}/${totalRounds}` : '--'}</div>
        </div>
      </div>

      {children}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}

function ResultCard({
  score,
  totalRounds,
  correctCount,
  onRetry,
  onDone,
}: {
  score: number
  totalRounds: number
  correctCount: number
  onRetry: () => void
  onDone?: () => void
}) {
  const accuracy = totalRounds === 0 ? 0 : Math.round((correctCount / totalRounds) * 100)
  const badge = getResultBadge(accuracy)

  return (
    <div className="card-kid p-6 max-w-md mx-auto text-center">
      <div className="text-6xl mb-3">{badge.icon}</div>
      <div className="text-2xl font-extrabold text-gray-800 mb-1">{badge.title}</div>
      <div className="text-sm text-gray-400 mb-4">{badge.message}</div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="rounded-2xl bg-kid-bg p-3">
          <div className="text-xs text-gray-400 mb-1">总积分</div>
          <div className="text-lg font-extrabold text-kid-orange">{score}</div>
        </div>
        <div className="rounded-2xl bg-kid-bg p-3">
          <div className="text-xs text-gray-400 mb-1">答对</div>
          <div className="text-lg font-extrabold text-kid-green">{correctCount}/{totalRounds}</div>
        </div>
        <div className="rounded-2xl bg-kid-bg p-3">
          <div className="text-xs text-gray-400 mb-1">准确率</div>
          <div className="text-lg font-extrabold text-kid-blue">{accuracy}%</div>
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button onClick={onRetry} className="btn-primary">再玩一局</button>
        <button onClick={onDone} className="btn-secondary">返回游戏列表</button>
      </div>
    </div>
  )
}

function EmptyGameState({ onDone, loading }: { onDone?: () => void; loading: boolean }) {
  return (
    <div className="card-kid p-6 max-w-md mx-auto text-center">
      <div className="text-6xl mb-3">{loading ? '📦' : '📚'}</div>
      <div className="text-xl font-bold text-kid-blue mb-2">{loading ? '题库加载中...' : '题库还没准备好'}</div>
      <div className="text-sm text-gray-400 mb-4">
        {loading ? '正在装满 800 个汉字的练习关卡。' : '请先返回首页进入学习页，等待数据加载完成。'}
      </div>
      <button onClick={onDone} className="btn-primary">返回</button>
    </div>
  )
}

/* ====== 1. 字形拼图 PuzzleGame ====== */
export function PuzzleGame({ onDone, practiceSettings }: GameProps) {
  const { chars, loading } = useAllCharacters()
  const rewardGame = useGameReward()
  const difficulty: PracticeDifficulty = getPracticeDifficulty(practiceSettings || { ageGroup: '5-6', targetLevel: 'all' })
  const scopedChars = useMemo(() => filterCharactersForPractice(chars, practiceSettings || { ageGroup: '5-6', targetLevel: 'all' }), [chars, practiceSettings])
  const [roundIndex, setRoundIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [rounds, setRounds] = useState<PuzzleRound[]>([])
  const [rewardIssued, setRewardIssued] = useState(false)

  useEffect(() => {
    if (scopedChars.length === 0) return
    setRounds(createPuzzleRounds(scopedChars, difficulty.roundCount))
    setRoundIndex(0)
    setScore(0)
    setStreak(0)
    setCorrectCount(0)
    setFeedback('')
    setSelectedIds([])
    setRewardIssued(false)
  }, [difficulty.roundCount, scopedChars])

  const finished = rounds.length > 0 && roundIndex >= rounds.length

  useEffect(() => {
    if (!finished || rewardIssued) return
    setRewardIssued(true)
    void rewardGame(rounds.map((round) => round.answer), 3)
  }, [finished, rewardGame, rewardIssued, rounds])

  const currentRound = finished ? null : rounds[roundIndex]
  const selectedPieces = useMemo(() => {
    if (!currentRound) return []
    return selectedIds
      .map((id) => currentRound.tray.find((piece) => piece.id === id))
      .filter(Boolean) as PuzzlePiece[]
  }, [currentRound, selectedIds])

  if (loading || rounds.length === 0) {
    return <EmptyGameState onDone={onDone} loading={loading} />
  }

  if (finished || !currentRound) {
    return (
      <ResultCard
        score={score}
        totalRounds={rounds.length}
        correctCount={correctCount}
        onRetry={() => {
          setRounds(createPuzzleRounds(scopedChars, difficulty.roundCount))
          setRoundIndex(0)
          setScore(0)
          setStreak(0)
          setCorrectCount(0)
          setFeedback('')
          setSelectedIds([])
          setRewardIssued(false)
        }}
        onDone={onDone}
      />
    )
  }

  const handleSelect = (piece: PuzzlePiece) => {
    if (selectedIds.includes(piece.id)) return

    const nextIds = [...selectedIds, piece.id]
    const nextPieces = nextIds
      .map((id) => currentRound.tray.find((item) => item.id === id))
      .filter(Boolean) as PuzzlePiece[]
    setSelectedIds(nextIds)

    const isComplete = nextPieces.length === currentRound.slots.length
    if (!isComplete) return

    const isCorrect = nextPieces.every((piece, index) => piece.char === currentRound.slots[index].char)
    if (isCorrect) {
      const nextStreak = streak + 1
      setFeedback(randomMessage(praiseMessages))
      setStreak(nextStreak)
      setCorrectCount((value) => value + 1)
      setScore((value) => value + 12 + Math.min(8, nextStreak * 2))
      window.setTimeout(() => {
        setRoundIndex((value) => value + 1)
        setSelectedIds([])
        setFeedback('')
      }, 900)
    } else {
      setFeedback(randomMessage(retryMessages))
      setStreak(0)
      window.setTimeout(() => {
        setSelectedIds([])
        setFeedback('')
      }, 850)
    }
  }

  const selectedChars = selectedPieces.map((piece) => piece.char).join('')
  const answer = currentRound.answer

  return (
    <GameShell
      title="🧩 字形拼图"
      subtitle="把部件拼成真正的汉字，像拆乐高一样认识字形"
      score={score}
      streak={streak}
      round={roundIndex + 1}
      totalRounds={rounds.length}
      badge={`Level ${answer.level} · ${answer.theme}`}
      footer={
        <div className="flex justify-between items-center text-sm">
          <button
            onClick={() => {
              setSelectedIds([])
              setFeedback('清空拼图，再试一次。')
              window.setTimeout(() => setFeedback(''), 600)
            }}
            className="text-gray-400 underline"
          >
            重新摆放
          </button>
          <button onClick={onDone} className="text-gray-400 underline">退出</button>
        </div>
      }
    >
      <div className="text-center mb-4">
        <div className="text-6xl font-extrabold text-gray-800 mb-2">{answer.char}</div>
        <div className="text-kid-red font-bold mb-1">{answer.pinyin}</div>
        <div className="text-xs text-gray-400">提示：这个字和“{getDisplayWord(answer)}”有关</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {currentRound.tray.map((piece) => {
          const picked = selectedIds.includes(piece.id)
          return (
            <motion.button
              key={piece.id}
              whileHover={{ scale: picked ? 1 : 1.05 }}
              whileTap={{ scale: picked ? 1 : 0.95 }}
              onClick={() => handleSelect(piece)}
              disabled={picked}
              className={`rounded-2xl px-3 py-4 text-center shadow-md transition-all ${
                picked
                  ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                  : piece.source === 'answer'
                    ? 'bg-kid-yellow text-gray-800 hover:bg-kid-orange hover:text-white'
                    : 'bg-kid-blue/10 text-kid-blue hover:bg-kid-blue hover:text-white'
              }`}
            >
              <div className="text-3xl font-extrabold">{piece.char}</div>
              <div className="text-[10px] mt-1 opacity-70">{piece.role}</div>
            </motion.button>
          )
        })}
      </div>

      <div className="rounded-2xl bg-kid-bg p-4 mb-3">
        <div className="text-xs text-gray-400 mb-2 text-center">拼图轨道</div>
        <div className="flex justify-center gap-2 mb-2">
          {currentRound.slots.map((slot, index) => {
            const piece = selectedPieces[index]
            return (
              <div
                key={slot.id}
                className={`w-14 h-14 rounded-2xl border-2 border-dashed flex items-center justify-center text-2xl font-bold ${
                  piece ? 'border-kid-green bg-white text-kid-green' : 'border-gray-300 text-gray-300'
                }`}
              >
                {piece?.char || '?'}
              </div>
            )
          })}
        </div>
        <div className="text-center text-sm text-gray-500 min-h-[24px]">
          {selectedChars ? `你正在拼：${selectedChars}` : '按顺序点选部件，把字拼出来'}
        </div>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center font-bold text-kid-green min-h-[28px]"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  )
}

/* ====== 2. 部首归类 SortGame ====== */
export function SortGame({ onDone, practiceSettings }: GameProps) {
  const { chars, loading } = useAllCharacters()
  const rewardGame = useGameReward()
  const difficulty: PracticeDifficulty = getPracticeDifficulty(practiceSettings || { ageGroup: '5-6', targetLevel: 'all' })
  const scopedChars = useMemo(() => filterCharactersForPractice(chars, practiceSettings || { ageGroup: '5-6', targetLevel: 'all' }), [chars, practiceSettings])
  const [families, setFamilies] = useState<RadicalFamily[]>([])
  const [matches, setMatches] = useState<Record<string, Character[]>>({})
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [rewardIssued, setRewardIssued] = useState(false)

  useEffect(() => {
    if (scopedChars.length === 0) return
    setFamilies(createRadicalFamilies(scopedChars, difficulty.familyCount, difficulty.charsPerFamily))
    setMatches({})
    setScore(0)
    setStreak(0)
    setCorrectCount(0)
    setFeedback('')
    setRewardIssued(false)
  }, [difficulty.charsPerFamily, difficulty.familyCount, scopedChars])

  const totalTargets = families.reduce((sum, family) => sum + family.characters.length, 0)
  const placedIds = new Set(Object.values(matches).flat().map((character) => character.id))
  const pool = shuffleItems(families.flatMap((family) => family.characters)).filter((character) => !placedIds.has(character.id))
  const finished = families.length > 0 && pool.length === 0

  useEffect(() => {
    if (!finished || rewardIssued) return
    setRewardIssued(true)
    void rewardGame(families.flatMap((family) => family.characters), 3)
  }, [families, finished, rewardGame, rewardIssued])

  if (loading || families.length === 0) {
    return <EmptyGameState onDone={onDone} loading={loading} />
  }

  if (finished) {
    return (
      <ResultCard
        score={score}
        totalRounds={totalTargets}
        correctCount={correctCount}
        onRetry={() => {
          setFamilies(createRadicalFamilies(scopedChars, difficulty.familyCount, difficulty.charsPerFamily))
          setMatches({})
          setScore(0)
          setStreak(0)
          setCorrectCount(0)
          setFeedback('')
          setRewardIssued(false)
        }}
        onDone={onDone}
      />
    )
  }

  const handleDrop = (family: RadicalFamily, character: Character) => {
    const belongs = family.characters.some((item) => item.id === character.id)
    if (belongs) {
      const nextStreak = streak + 1
      setMatches((current) => ({
        ...current,
        [family.radical]: [...(current[family.radical] || []), character],
      }))
      setScore((value) => value + 6 + Math.min(10, nextStreak * 2))
      setStreak(nextStreak)
      setCorrectCount((value) => value + 1)
      setFeedback(`🎯 ${character.char} 找到 ${family.radical} 家啦！`)
    } else {
      setStreak(0)
      setFeedback(`🧭 ${character.char} 不在 ${family.radical} 家，再看看偏旁。`)
    }
    window.setTimeout(() => setFeedback(''), 900)
  }

  return (
    <GameShell
      title="🏘️ 部首家族"
      subtitle="把汉字送回对应的偏旁小屋，认识字和字之间的家族关系"
      score={score}
      streak={streak}
      round={correctCount + 1}
      totalRounds={totalTargets}
      badge="4个部首小屋"
      footer={<button onClick={onDone} className="text-sm text-gray-400 underline">退出</button>}
    >
      <div className="grid grid-cols-2 gap-3 mb-5">
        {families.map((family) => {
          const placed = matches[family.radical] || []
          return (
            <div
              key={family.radical}
              className="rounded-3xl bg-gradient-to-br from-white to-kid-bg p-4 border-2 border-dashed border-kid-green/30 min-h-[140px]"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                const id = Number(event.dataTransfer.getData('text/plain'))
                const character = pool.find((item) => item.id === id)
                if (character) handleDrop(family, character)
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-11 h-11 rounded-2xl bg-kid-green/15 text-kid-green font-extrabold text-2xl flex items-center justify-center">
                  {family.radical}
                </div>
                <div>
                  <div className="font-bold text-gray-800">{family.label}</div>
                  <div className="text-xs text-gray-400">收集 {family.characters.length} 个字</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {placed.map((character) => (
                  <motion.div
                    key={character.id}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="px-3 py-2 rounded-2xl bg-white shadow text-xl font-bold text-kid-blue"
                  >
                    {character.char}
                  </motion.div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-3xl bg-kid-bg p-4 mb-3">
        <div className="text-sm font-bold text-gray-700 mb-3">待归位的汉字</div>
        <div className="flex flex-wrap justify-center gap-2">
          {pool.map((character) => (
            <button
              key={character.id}
              draggable
              onDragStart={(event) => event.dataTransfer.setData('text/plain', String(character.id))}
              className="rounded-2xl bg-white shadow-md px-4 py-3 cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-transform"
            >
              <div className="text-3xl font-extrabold text-gray-800">{character.char}</div>
              <div className="text-[10px] text-gray-400 mt-1">{character.pinyin}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 min-h-[24px]">{feedback || '拖动汉字，把它送回正确的偏旁小屋。'}</div>
    </GameShell>
  )
}

/* ====== 3. 看图选字 MatchGame ====== */
export function MatchGame({ onDone, practiceSettings }: GameProps) {
  const { chars, loading } = useAllCharacters()
  const rewardGame = useGameReward()
  const difficulty: PracticeDifficulty = getPracticeDifficulty(practiceSettings || { ageGroup: '5-6', targetLevel: 'all' })
  const scopedChars = useMemo(() => filterCharactersForPractice(chars, practiceSettings || { ageGroup: '5-6', targetLevel: 'all' }), [chars, practiceSettings])
  const [rounds, setRounds] = useState<ChoiceRound[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [rewardIssued, setRewardIssued] = useState(false)

  useEffect(() => {
    if (scopedChars.length === 0) return
    setRounds(createChoiceRounds(scopedChars, difficulty.roundCount))
    setRoundIndex(0)
    setScore(0)
    setStreak(0)
    setCorrectCount(0)
    setFeedback('')
    setRewardIssued(false)
  }, [difficulty.roundCount, scopedChars])

  const finished = rounds.length > 0 && roundIndex >= rounds.length

  useEffect(() => {
    if (!finished || rewardIssued) return
    setRewardIssued(true)
    void rewardGame(rounds.map((item) => item.answer), 3)
  }, [finished, rewardGame, rewardIssued, rounds])

  if (loading || rounds.length === 0) {
    return <EmptyGameState onDone={onDone} loading={loading} />
  }

  const round = finished ? null : rounds[roundIndex]
  if (finished || !round) {
    return (
      <ResultCard
        score={score}
        totalRounds={rounds.length}
        correctCount={correctCount}
        onRetry={() => {
          setRounds(createChoiceRounds(scopedChars, difficulty.roundCount))
          setRoundIndex(0)
          setScore(0)
          setStreak(0)
          setCorrectCount(0)
          setFeedback('')
          setRewardIssued(false)
        }}
        onDone={onDone}
      />
    )
  }

  const sentenceHint = buildSentenceHint(round.answer.sentence, round.answer.char)

  const handlePick = (choice: Character) => {
    if (choice.id === round.answer.id) {
      const nextStreak = streak + 1
      setFeedback(randomMessage(praiseMessages))
      setScore((value) => value + 10 + Math.min(10, nextStreak * 2))
      setCorrectCount((value) => value + 1)
      setStreak(nextStreak)
      window.setTimeout(() => {
        setRoundIndex((value) => value + 1)
        setFeedback('')
      }, 900)
    } else {
      setFeedback(`😅 不是“${choice.char}”，试试再看看图和线索。`)
      setStreak(0)
      window.setTimeout(() => setFeedback(''), 800)
    }
  }

  return (
    <GameShell
      title="🖼️ 看图识画"
      subtitle="看图、看线索、看例句，把汉字认出来"
      score={score}
      streak={streak}
      round={roundIndex + 1}
      totalRounds={rounds.length}
      badge={`${round.answer.theme} · ${round.answer.constructionType}`}
      footer={<button onClick={onDone} className="text-sm text-gray-400 underline">退出</button>}
    >
      <div className="text-center mb-4">
        <div className="text-8xl mb-4">{getFallbackEmoji(round.answer)}</div>
        <div className="rounded-2xl bg-kid-bg p-3 text-sm text-gray-600 space-y-1">
          <div>线索词：<span className="font-bold text-kid-blue">{getDisplayWord(round.answer)}</span></div>
          {sentenceHint && <div>例句提示：{sentenceHint}</div>}
          <div className="text-kid-orange">意思提示：{getPrimaryMeaning(round.answer)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {round.choices.map((choice) => (
          <motion.button
            key={choice.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePick(choice)}
            className="rounded-3xl bg-white shadow-md p-4 text-center hover:bg-kid-yellow/15 transition-colors"
          >
            <div className="text-4xl font-extrabold text-gray-800 mb-1">{choice.char}</div>
            <div className="text-xs text-gray-400">{choice.pinyin}</div>
          </motion.button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500 min-h-[24px]">{feedback || '先看图，再结合词语和例句想一想。'}</div>
    </GameShell>
  )
}

/* ====== 5. 听音找字 ListenGame ====== */
export function ListenGame({ onDone, practiceSettings }: GameProps) {
  const { chars, loading } = useAllCharacters()
  const rewardGame = useGameReward()
  const difficulty: PracticeDifficulty = getPracticeDifficulty(practiceSettings || { ageGroup: '5-6', targetLevel: 'all' })
  const scopedChars = useMemo(() => filterCharactersForPractice(chars, practiceSettings || { ageGroup: '5-6', targetLevel: 'all' }), [chars, practiceSettings])
  const [rounds, setRounds] = useState<ChoiceRound[]>([])
  const [roundIndex, setRoundIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [rewardIssued, setRewardIssued] = useState(false)

  useEffect(() => {
    if (scopedChars.length === 0) return
    setRounds(createChoiceRounds(scopedChars, difficulty.roundCount))
    setRoundIndex(0)
    setScore(0)
    setStreak(0)
    setCorrectCount(0)
    setFeedback('')
    setShowHint(false)
    setRewardIssued(false)
  }, [difficulty.roundCount, scopedChars])

  useEffect(() => {
    setShowHint(false)
  }, [roundIndex])

  const finished = rounds.length > 0 && roundIndex >= rounds.length

  useEffect(() => {
    if (!finished || rewardIssued) return
    setRewardIssued(true)
    void rewardGame(rounds.map((item) => item.answer), 3)
  }, [finished, rewardGame, rewardIssued, rounds])

  if (loading || rounds.length === 0) {
    return <EmptyGameState onDone={onDone} loading={loading} />
  }

  const round = finished ? null : rounds[roundIndex]
  if (finished || !round) {
    return (
      <ResultCard
        score={score}
        totalRounds={rounds.length}
        correctCount={correctCount}
        onRetry={() => {
          setRounds(createChoiceRounds(scopedChars, difficulty.roundCount))
          setRoundIndex(0)
          setScore(0)
          setStreak(0)
          setCorrectCount(0)
          setFeedback('')
          setShowHint(false)
          setRewardIssued(false)
        }}
        onDone={onDone}
      />
    )
  }

  const speakAnswer = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(round.answer.char)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.75
    utterance.pitch = 1.05
    window.speechSynthesis.speak(utterance)
  }

  const handlePick = (choice: Character) => {
    if (choice.id === round.answer.id) {
      const nextStreak = streak + 1
      setFeedback(randomMessage(praiseMessages))
      setScore((value) => value + 10 + Math.min(10, nextStreak * 2))
      setCorrectCount((value) => value + 1)
      setStreak(nextStreak)
      window.setTimeout(() => {
        setRoundIndex((value) => value + 1)
        setFeedback('')
      }, 900)
    } else {
      setFeedback(`👂 不是“${choice.char}”，再听一遍试试。`)
      setStreak(0)
      window.setTimeout(() => setFeedback(''), 800)
    }
  }

  return (
    <GameShell
      title="👂 听音找字"
      subtitle="听发音、看词语提示，从多个汉字里找出正确答案"
      score={score}
      streak={streak}
      round={roundIndex + 1}
      totalRounds={rounds.length}
      badge={`Level ${round.answer.level}`}
      footer={<button onClick={onDone} className="text-sm text-gray-400 underline">退出</button>}
    >
      <div className="text-center mb-4">
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={speakAnswer}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-kid-yellow to-kid-orange shadow-lg text-4xl mb-3"
        >
          🔊
        </motion.button>
        <div className="text-sm text-gray-500 mb-3">点一下喇叭，听这个字怎么读</div>

        <div className="rounded-2xl bg-kid-bg p-3 text-sm text-gray-600 space-y-1">
          <div>词语提示：<span className="font-bold text-kid-blue">{getDisplayWord(round.answer)}</span></div>
          <div>主题提示：<span className="font-bold text-kid-purple">{round.answer.theme}</span></div>
          {showHint && <div className="text-kid-red font-bold">拼音提示：{round.answer.pinyin}</div>}
        </div>

        <button
          onClick={() => setShowHint((value) => !value)}
          className="mt-3 text-sm text-gray-400 underline"
        >
          {showHint ? '隐藏拼音提示' : '显示拼音提示'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {round.choices.map((choice) => (
          <motion.button
            key={choice.id}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePick(choice)}
            className="rounded-3xl bg-white shadow-md p-4 text-center hover:bg-kid-yellow/10 transition-colors"
          >
            <div className="text-4xl font-extrabold text-gray-800 mb-1">{choice.char}</div>
            <div className="text-xs text-gray-400">{choice.theme}</div>
          </motion.button>
        ))}
      </div>

      <div className="flex justify-center gap-3 text-sm">
        <button onClick={speakAnswer} className="text-kid-blue font-bold underline">再听一遍</button>
        <button onClick={() => window.speechSynthesis.cancel()} className="text-gray-400 underline">停止播放</button>
      </div>

      <div className="text-center text-sm text-gray-500 min-h-[24px] mt-3">{feedback || '先听，再看词语提示，选出真正的汉字。'}</div>
    </GameShell>
  )
}
