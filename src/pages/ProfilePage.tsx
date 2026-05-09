import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useProfileStore } from '@/store/profileStore'
import { useAllCharacters } from '@/hooks/useCharacterData'
import type { UserProfile } from '@/types'

const avatars = ['🐼', '🐯', '🐰', '🦊', '🐸', '🐵', '🐶', '🐱', '🦁', '🐻']
const ageGroups: { value: UserProfile['ageGroup']; label: string }[] = [
  { value: '3-4', label: '3-4岁' },
  { value: '5-6', label: '5-6岁' },
  { value: '7-8', label: '7-8岁' },
]

export default function ProfilePage() {
  const {
    profiles, activeProfileId, loaded, loadProfiles,
    addProfile, setActive, updateProfile, removeProfile,
  } = useProfileStore()

  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newAvatar, setNewAvatar] = useState('🐼')
  const [newAge, setNewAge] = useState<UserProfile['ageGroup']>('5-6')

  useEffect(() => { loadProfiles() }, [loadProfiles])

  const activeProfile = profiles.find((p) => p.id === activeProfileId)
  const { chars: allChars, loading } = useAllCharacters()
  const studiedCount = allChars.length

  const handleCreate = async () => {
    if (!newName.trim()) return
    await addProfile({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: newName.trim(),
      avatar: newAvatar,
      ageGroup: newAge,
      dailyTimeLimit: 30,
      dailyWordGoal: 5,
      createdAt: new Date().toISOString(),
    })
    setNewName('')
    setNewAvatar('🐼')
    setShowCreate(false)
  }

  const handleDelete = async (id: string) => {
    if (profiles.length <= 1) return
    await removeProfile(id)
  }

  return (
    <div className="pt-6 pb-4 max-w-md mx-auto">
      <h1 className="text-2xl font-extrabold text-center text-gray-800 mb-5">👤 我的</h1>

      {/* 档案切换 */}
      {profiles.length > 0 && (
        <div className="card-kid p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm text-gray-500">小朋友档案</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="text-kid-blue font-bold text-sm hover:underline"
            >
              + 添加
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {profiles.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (editingId === p.id) return
                  setActive(p.id)
                }}
                onDoubleClick={() => setEditingId(p.id)}
                className={`flex-shrink-0 w-20 rounded-2xl p-2 text-center transition-all ${
                  activeProfileId === p.id
                    ? 'bg-kid-blue text-white shadow-lg'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="text-2xl mb-1">{p.avatar}</div>
                <div className="text-xs font-bold truncate">{p.name}</div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 创建/编辑 */}
      <AnimatePresence>
        {(showCreate || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="card-kid p-5 mb-4 overflow-hidden"
          >
            <h2 className="font-bold text-lg mb-3">
              {showCreate ? '➕ 创建新档案' : '✏️ 编辑档案'}
            </h2>

            <input
              value={editingId ? profiles.find((p) => p.id === editingId)?.name || '' : newName}
              onChange={(e) => {
                if (editingId) {
                  const p = profiles.find((p) => p.id === editingId)
                  if (p) updateProfile(editingId, { ...p, name: e.target.value })
                } else {
                  setNewName(e.target.value)
                }
              }}
              placeholder="小朋友的名字"
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-kid-blue outline-none text-lg mb-3"
            />

            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-2">选择头像</div>
              <div className="flex justify-start gap-2 flex-wrap">
                {avatars.map((a) => {
                  const selected = editingId
                    ? profiles.find((p) => p.id === editingId)?.avatar === a
                    : newAvatar === a
                  return (
                    <button
                      key={a}
                      onClick={() => {
                        if (editingId) {
                          const p = profiles.find((p) => p.id === editingId)
                          if (p) updateProfile(editingId, { ...p, avatar: a })
                        } else {
                          setNewAvatar(a)
                        }
                      }}
                      className={`text-2xl p-2 rounded-xl transition-all ${
                        selected ? 'bg-kid-blue/20 scale-110 ring-2 ring-kid-blue' : 'hover:bg-gray-100'
                      }`}
                    >
                      {a}
                    </button>
                  )
                })}
              </div>
            </div>

            {showCreate && (
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">年龄段</div>
                <div className="flex gap-2">
                  {ageGroups.map((ag) => (
                    <button
                      key={ag.value}
                      onClick={() => setNewAge(ag.value)}
                      className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${
                        newAge === ag.value
                          ? 'bg-kid-blue text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {ag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {showCreate ? (
                <button onClick={handleCreate} className="btn-primary flex-1 text-sm">
                  创建
                </button>
              ) : (
                <button
                  onClick={() => setEditingId(null)}
                  className="btn-success flex-1 text-sm"
                >
                  完成
                </button>
              )}
              <button
                onClick={() => { setShowCreate(false); setEditingId(null) }}
                className="btn-kid bg-gray-200 text-gray-600 text-sm flex-1"
              >
                取消
              </button>
              {editingId && profiles.length > 1 && (
                <button
                  onClick={() => { handleDelete(editingId); setEditingId(null) }}
                  className="btn-kid bg-kid-red text-white text-sm px-3"
                >
                  删除
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 当前档案统计 */}
      {activeProfile && (
        <>
          <div className="card-kid p-6 text-center mb-4">
            <div className="text-6xl mb-2">{activeProfile.avatar}</div>
            <div className="text-xl font-extrabold text-gray-800 mb-1">{activeProfile.name}</div>
            <div className="text-sm text-gray-400">{activeProfile.ageGroup}岁</div>
          </div>

          {/* 成就徽章 */}
          <div className="card-kid p-5 mb-4">
            <h2 className="font-bold text-lg mb-3">🏆 成就徽章</h2>
            <div className="grid grid-cols-5 gap-2">
              {[
                { name: '初学', icon: '🌟', earned: studiedCount >= 5 },
                { name: '小书虫', icon: '📖', earned: studiedCount >= 10 },
                { name: '笔顺大师', icon: '✏️', earned: studiedCount >= 20 },
                { name: '神射手', icon: '🎯', earned: studiedCount >= 30 },
                { name: '探索家', icon: '🔍', earned: studiedCount >= 50 },
              ].map((b, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-lg transition-all ${
                    b.earned ? 'bg-kid-yellow/20' : 'bg-gray-100 opacity-40'
                  }`}
                >
                  <span>{b.icon}</span>
                  <span className="text-[10px] mt-0.5 text-gray-400">{b.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 学习统计 */}
          <div className="card-kid p-5">
            <h2 className="font-bold text-lg mb-3">📊 学习统计</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">可用汉字</span>
                <span className="font-bold text-kid-blue">{loading ? '...' : `${studiedCount} 字`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Level 进度</span>
                <span className="font-bold text-kid-green">Level 1-3 / 10</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">每日目标</span>
                <span className="font-bold text-kid-orange">{activeProfile.dailyWordGoal} 字/天</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">时长限制</span>
                <span className="font-bold text-kid-purple">{activeProfile.dailyTimeLimit} 分钟/天</span>
              </div>
            </div>
          </div>
        </>
      )}

      {!loaded && (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      )}

      {loaded && profiles.length === 0 && !showCreate && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🐼</div>
          <p className="text-gray-400 mb-4">还没有创建档案哦</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            创建第一个档案 →
          </button>
        </div>
      )}
    </div>
  )
}
