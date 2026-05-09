import { motion } from 'framer-motion'
import { useState } from 'react'
import type { GameType } from '@/types'
import { PuzzleGame, SortGame, MatchGame, ListenGame } from '@/components/GameBoard'
import { WritingPad } from '@/components/GameBoard/WritingPad'

const games: { id: GameType; title: string; icon: string; desc: string; color: string }[] = [
  { id: 'puzzle', title: '字形拼图', icon: '🧩', desc: '把部件拼成完整的汉字', color: 'from-kid-red to-kid-orange' },
  { id: 'sort', title: '部首家族', icon: '🏘️', desc: '把相同偏旁的字归到一起', color: 'from-kid-green to-teal-400' },
  { id: 'match', title: '看图识画', icon: '🖼️', desc: '看插画选对应的汉字', color: 'from-kid-blue to-kid-purple' },
  { id: 'writing', title: '描红工坊', icon: '✏️', desc: '屏幕书写，笔画评分', color: 'from-kid-purple to-kid-pink' },
  { id: 'listen', title: '听音找字', icon: '👂', desc: '听读音选出正确汉字', color: 'from-kid-yellow to-kid-orange' },
]

type GameRendererProps = { onDone: () => void }

const gameRenderers: Record<GameType, React.FC<GameRendererProps>> = {
  puzzle: PuzzleGame,
  sort: SortGame,
  match: MatchGame,
  writing: WritingPad,
  listen: ListenGame,
}

export default function PracticePage() {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)

  if (selectedGame) {
    const GameComp = gameRenderers[selectedGame]
    return (
      <div className="pt-4 pb-4">
        <button
          onClick={() => setSelectedGame(null)}
          className="text-kid-blue font-bold mb-4 flex items-center gap-1 text-lg"
        >
          ← 返回游戏列表
        </button>
        <GameComp onDone={() => setSelectedGame(null)} />
      </div>
    )
  }

  return (
    <div className="pt-6 pb-4">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-2">🎮 练习游戏</h1>
      <p className="text-center text-gray-400 text-sm mb-5">选一个游戏开始练习吧！</p>

      <div className="space-y-3 max-w-md mx-auto">
        {games.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelectedGame(game.id)}
            className={`w-full bg-gradient-to-r ${game.color} rounded-2xl p-4 text-white text-left shadow-lg`}
          >
            <div className="flex items-center gap-3">
              <span className="text-4xl">{game.icon}</span>
              <div>
                <div className="font-extrabold text-lg">{game.title}</div>
                <div className="text-sm opacity-80">{game.desc}</div>
              </div>
              <span className="ml-auto text-2xl">→</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
