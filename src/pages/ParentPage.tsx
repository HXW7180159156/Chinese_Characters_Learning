import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useAllCharacters } from '@/hooks/useCharacterData'
import { updateDailyStats, getDailyStats } from '@/services/localDb'

export default function ParentPage() {
  const { profiles, activeProfileId, loadProfiles, updateProfile } = useProfileStore()
  const [dailyData, setDailyData] = useState<{ study_seconds: number; words_learned: number; games_played: number } | null>(null)

  const activeProfile = profiles.find((p) => p.id === activeProfileId)
  const { chars: allChars } = useAllCharacters()

  useEffect(() => {
    loadProfiles()
  }, [loadProfiles])

  useEffect(() => {
    if (!activeProfileId) return
    const today = new Date().toISOString().slice(0, 10)
    getDailyStats(activeProfileId, 7).then((rows) => {
      const todayRow = (rows as Record<string, unknown>[]).find((r) => r.date === today)
      setDailyData(todayRow as typeof dailyData)
    })
  }, [activeProfileId])

  if (!activeProfile) {
    return (
      <div className="pt-6 pb-4 max-w-md mx-auto">
        <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-2">👨‍👩‍👧 家长面板</h1>
        <p className="text-center text-gray-400 text-sm mb-5">查看小朋友的学习情况</p>
        <div className="card-kid p-8 text-center">
          <div className="text-6xl mb-3">👋</div>
          <p className="text-gray-400">请先在 "我的" 页面创建或选择一个小朋友档案</p>
        </div>
      </div>
    )
  }

  const todaySecs = dailyData?.study_seconds || 0
  const todayMins = Math.round(todaySecs / 60)
  const timePercent = Math.min(100, (todaySecs / (activeProfile.dailyTimeLimit * 60)) * 100)
  const studiedTotal = allChars.length
  const masteredRate = 0
  const weeklyNew = dailyData?.words_learned || 0

  return (
    <div className="pt-6 pb-4">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-1">👨‍👩‍👧 家长面板</h1>
      <p className="text-center text-gray-400 text-sm mb-5">
        <span className="font-bold text-kid-blue">{activeProfile.avatar} {activeProfile.name}</span> 的学习情况
      </p>

      <div className="space-y-4 max-w-md mx-auto">
        {/* 学习报告 */}
        <motion.section
          className="card-kid p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">📊 学习报告</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-kid-bg rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-kid-green">{studiedTotal}</div>
              <div className="text-xs text-gray-500">可用汉字</div>
            </div>
            <div className="bg-kid-bg rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-kid-blue">{masteredRate}%</div>
              <div className="text-xs text-gray-500">掌握率</div>
            </div>
            <div className="bg-kid-bg rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-kid-orange">{weeklyNew}</div>
              <div className="text-xs text-gray-500">本周新学</div>
            </div>
            <div className="bg-kid-bg rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-kid-purple">{todayMins}分</div>
              <div className="text-xs text-gray-500">今日学习</div>
            </div>
          </div>
        </motion.section>

        {/* 时长管控 */}
        <motion.section
          className="card-kid p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">⏳ 时长管控</h2>
          <div className="bg-kid-bg rounded-xl p-4">
            <div className="flex justify-between text-sm mb-1">
              <span>每日限时</span>
              <span className="font-bold text-kid-orange">{activeProfile.dailyTimeLimit} 分钟</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${timePercent}%`,
                  background: timePercent > 80
                    ? 'linear-gradient(to right, #FF6B6B, #FFA94D)'
                    : 'linear-gradient(to right, #69DB7C, #4DABF7)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${timePercent}%` }}
              />
            </div>
            <div className={`text-xs mt-1 ${timePercent > 80 ? 'text-kid-red font-bold' : 'text-gray-400'}`}>
              今日已学 {todayMins} 分钟
              {timePercent >= 100 && ' ⚠️ 已达上限'}
            </div>
          </div>
        </motion.section>

        {/* 练习分析 */}
        <motion.section
          className="card-kid p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">📋 练习分析</h2>
          {dailyData ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">今日学字</span>
                <span className="font-bold text-kid-green">{dailyData.words_learned} 个</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-kid-green h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (dailyData.words_learned / activeProfile.dailyWordGoal) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">今日游戏</span>
                <span className="font-bold text-kid-blue">{dailyData.games_played} 局</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">学习时长</span>
                <span className="font-bold text-kid-purple">{todayMins} 分钟</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">暂无练习数据，快去学习吧！</p>
          )}
        </motion.section>

        {/* 目标设定 */}
        <motion.section
          className="card-kid p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">🎯 目标设定</h2>
          <div className="bg-kid-bg rounded-xl p-4 mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span>每日学字目标</span>
              <span className="font-bold text-kid-blue">{activeProfile.dailyWordGoal} 个</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={activeProfile.dailyWordGoal}
              onChange={(e) => updateProfile(activeProfile.id, { dailyWordGoal: Number(e.target.value) })}
              className="w-full accent-kid-blue"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1</span>
              <span>20</span>
            </div>
          </div>

          <div className="bg-kid-bg rounded-xl p-4">
            <div className="flex justify-between text-sm mb-1">
              <span>每日时长限制</span>
              <span className="font-bold text-kid-orange">{activeProfile.dailyTimeLimit} 分钟</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={activeProfile.dailyTimeLimit}
              onChange={(e) => updateProfile(activeProfile.id, { dailyTimeLimit: Number(e.target.value) })}
              className="w-full accent-kid-orange"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>10分钟</span>
              <span>120分钟</span>
            </div>
          </div>
        </motion.section>

        {/* 快速操作 */}
        <motion.section
          className="card-kid p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2">⚡ 快速操作</h2>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10)
                updateDailyStats(activeProfile.id, today, { studySeconds: 60, wordsLearned: 1 })
                setDailyData((d) => d ? {
                  ...d, study_seconds: d.study_seconds + 60, words_learned: d.words_learned + 1
                } : { study_seconds: 60, words_learned: 1, games_played: 0 })
              }}
              className="btn-kid bg-kid-green/10 text-kid-green text-sm"
            >
              + 1分钟学习
            </button>
            <button
              onClick={() => {
                const today = new Date().toISOString().slice(0, 10)
                updateDailyStats(activeProfile.id, today, { gamesPlayed: 1 })
                setDailyData((d) => d ? { ...d, games_played: d.games_played + 1 } : { study_seconds: 0, words_learned: 0, games_played: 1 })
              }}
              className="btn-kid bg-kid-purple/10 text-kid-purple text-sm"
            >
              + 1局游戏
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  )
}
