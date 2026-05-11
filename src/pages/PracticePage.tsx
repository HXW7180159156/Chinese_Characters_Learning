import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import type { GameType } from '@/types'
import { PuzzleGame, SortGame, MatchGame, ListenGame } from '@/components/GameBoard'
import { WritingPad } from '@/components/GameBoard/WritingPad'
import { useAllCharacters } from '@/hooks/useCharacterData'
import { useProfileStore } from '@/store/profileStore'
import {
  buildPracticeSettings,
  getDailyChallenges,
  getDefaultPracticeLevel,
  getPracticeBadges,
  getPracticeDifficulty,
  getPracticeMeta,
  getPracticeScopeLabel,
  syncPracticeAchievements,
  type PracticeLevel,
  type PracticeSettings,
} from '@/services/practiceCenter'
import { getAchievements } from '@/services/localDb'

const games: { id: GameType; title: string; icon: string; desc: string; tip: string; color: string }[] = [
  { id: 'puzzle', title: '字形拼图', icon: '🧩', desc: '把部件拼成完整的汉字', tip: '适合认识字形结构', color: 'from-kid-red to-kid-orange' },
  { id: 'sort', title: '部首家族', icon: '🏘️', desc: '把相同偏旁的字归到一起', tip: '适合建立偏旁家族感', color: 'from-kid-green to-teal-400' },
  { id: 'match', title: '看图识画', icon: '🖼️', desc: '看图画和线索选对应汉字', tip: '适合图像联想记忆', color: 'from-kid-blue to-kid-purple' },
  { id: 'writing', title: '描红工坊', icon: '✏️', desc: '屏幕书写，支持轻松练与挑战练', tip: '适合笔顺与书写练习', color: 'from-kid-purple to-kid-pink' },
  { id: 'listen', title: '听音找字', icon: '👂', desc: '听发音和词语提示选正确汉字', tip: '适合拼音和听辨训练', color: 'from-kid-yellow to-kid-orange' },
]

type GameRendererProps = { onDone: () => void; practiceSettings?: PracticeSettings }

const gameRenderers: Record<GameType, React.FC<GameRendererProps>> = {
  puzzle: PuzzleGame,
  sort: SortGame,
  match: MatchGame,
  writing: WritingPad,
  listen: ListenGame,
}

export default function PracticePage() {
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null)
  const [selectedLevel, setSelectedLevel] = useState<PracticeLevel | null>(null)
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const { chars, loading } = useAllCharacters()
  const { profiles, activeProfileId, loaded, loadProfiles } = useProfileStore()

  useEffect(() => {
    if (!loaded) void loadProfiles()
  }, [loaded, loadProfiles])

  const activeProfile = profiles.find((profile) => profile.id === activeProfileId)

  useEffect(() => {
    if (!activeProfileId) {
      setUnlockedAchievements([])
      return
    }
    void getAchievements(activeProfileId).then(setUnlockedAchievements)
  }, [activeProfileId])

  useEffect(() => {
    if (!activeProfile) return
    setSelectedLevel(getDefaultPracticeLevel(activeProfile.ageGroup))
  }, [activeProfile?.id, activeProfile?.ageGroup])

  const practiceSettings = useMemo(
    () => buildPracticeSettings(activeProfile, selectedLevel ?? undefined),
    [activeProfile, selectedLevel],
  )

  const difficulty = useMemo(() => getPracticeDifficulty(practiceSettings), [practiceSettings])
  const dailyChallenges = useMemo(
    () => getDailyChallenges(activeProfileId, practiceSettings),
    [activeProfileId, practiceSettings],
  )
  const practiceMeta = useMemo(() => getPracticeMeta(activeProfileId), [activeProfileId])
  const badges = getPracticeBadges()

  useEffect(() => {
    if (!activeProfileId) return
    void syncPracticeAchievements(activeProfileId, practiceSettings).then(async () => {
      const latest = await getAchievements(activeProfileId)
      setUnlockedAchievements(latest)
    })
  }, [activeProfileId, practiceSettings, practiceMeta.lastPlayedAt])

  const levelOptions: PracticeLevel[] = activeProfile
    ? [...Array.from({ length: 10 }, (_, index) => index + 1).filter((value) => value <= 10), 'all']
    : [3, 6, 'all']

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
        <GameComp onDone={() => setSelectedGame(null)} practiceSettings={practiceSettings} />
      </div>
    )
  }

  return (
    <div className="pt-6 pb-4">
      <div className="text-center mb-5">
        <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-2">🎮 练习游戏</h1>
        <p className="text-center text-gray-400 text-sm">把 800 个汉字变成一关关好玩的挑战</p>
      </div>

      <div className="card-kid max-w-md mx-auto p-4 mb-4 bg-gradient-to-r from-kid-yellow/10 via-white to-kid-pink/10">
        <div className="grid grid-cols-3 gap-2 text-center mb-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">题库覆盖</div>
            <div className="text-lg font-extrabold text-kid-orange">{loading ? '...' : `${chars.length}`}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">玩法数量</div>
            <div className="text-lg font-extrabold text-kid-blue">5 种</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">推荐方式</div>
            <div className="text-lg font-extrabold text-kid-green">每日闯关</div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/80 p-3">
          <div className="flex justify-between items-center mb-2 text-sm">
            <span className="text-gray-500">当前练习模式</span>
            <span className="font-bold text-kid-purple">{difficulty.label}</span>
          </div>
          <div className="text-xs text-gray-400 mb-3">{difficulty.tip}</div>
          <div className="text-xs text-gray-500 mb-2">按年龄自动推荐，也可以自己切换练习范围</div>
          <div className="flex flex-wrap gap-2">
            {levelOptions.map((option) => {
              const active = practiceSettings.targetLevel === option
              const label = option === 'all' ? '全题库' : `L1-${option}`
              return (
                <button
                  key={String(option)}
                  onClick={() => setSelectedLevel(option)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    active ? 'bg-kid-blue text-white' : 'bg-kid-bg text-gray-500'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          <div className="mt-3 text-xs text-kid-orange font-bold">
            {activeProfile
              ? `${activeProfile.avatar} ${activeProfile.name} · ${activeProfile.ageGroup}岁 · ${getPracticeScopeLabel(practiceSettings.targetLevel)}`
              : `游客模式 · ${getPracticeScopeLabel(practiceSettings.targetLevel)}`}
          </div>
        </div>
      </div>

      <div className="card-kid max-w-md mx-auto p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-extrabold text-gray-800">🌞 今日挑战</div>
            <div className="text-xs text-gray-400">完成今天的小目标，解锁奖励徽章</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">今日累计</div>
            <div className="text-sm font-bold text-kid-orange">{practiceMeta.dailyProgress[new Date().toISOString().slice(0, 10)]?.totalScore || 0} 分</div>
          </div>
        </div>

        <div className="space-y-3">
          {dailyChallenges.map((challenge) => {
            const percent = Math.round((challenge.progress / challenge.target) * 100)
            return (
              <div key={challenge.id} className="rounded-2xl bg-kid-bg p-3">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-bold text-gray-700">{challenge.label}</span>
                  <span className={`font-bold ${challenge.done ? 'text-kid-green' : 'text-kid-blue'}`}>
                    {challenge.progress}/{challenge.target} {challenge.unit}
                  </span>
                </div>
                <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${challenge.done ? 'bg-kid-green' : 'bg-kid-blue'}`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
                <div className="text-xs opacity-70 mt-1">{game.tip}</div>
              </div>
              <span className="ml-auto text-2xl">→</span>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="card-kid max-w-md mx-auto p-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-extrabold text-gray-800">🏅 徽章墙</div>
            <div className="text-xs text-gray-400">完成练习习惯和每日挑战会慢慢点亮</div>
          </div>
          <div className="text-sm font-bold text-kid-purple">
            {unlockedAchievements.length}/{badges.length}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge) => {
            const unlocked = unlockedAchievements.includes(badge.id)
            return (
              <div
                key={badge.id}
                className={`rounded-2xl p-3 text-center transition-all ${
                  unlocked ? 'bg-kid-yellow/20' : 'bg-gray-100 opacity-50'
                }`}
                title={badge.description}
              >
                <div className="text-2xl mb-1">{badge.icon}</div>
                <div className="text-[10px] font-bold text-gray-500">{badge.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 mt-4">
        小提示：先玩“看图识画”和“听音找字”，再去“描红工坊”巩固书写。
      </div>
    </div>
  )
}
