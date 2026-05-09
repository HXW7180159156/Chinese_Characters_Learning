import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import type { Character } from '@/types'
import StrokePlayer from './StrokePlayer'
import RadicalExplorer from './RadicalExplorer'
import CharacterStory from './CharacterStory'

interface Props {
  character: Character
}

export default function CharacterCard({ character }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'stroke' | 'radical' | 'story'>('overview')
  const [resolvedStrokeCount, setResolvedStrokeCount] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadStrokeCount() {
      setResolvedStrokeCount(null)
      try {
        const HanziWriter = (await import('hanzi-writer')).default
        const writer = HanziWriter.create(document.createElement('div'), character.char, {
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
  }, [character.char])

  const displayStrokeCount = resolvedStrokeCount ?? character.strokeCount

  const tabs = [
    { id: 'overview' as const, label: '概览', icon: '🔍' },
    { id: 'stroke' as const, label: '笔顺', icon: '✏️' },
    { id: 'radical' as const, label: '拆字', icon: '🧩' },
    { id: 'story' as const, label: '故事', icon: '📚' },
  ]

  return (
    <motion.div
      className="card-kid overflow-hidden max-w-md mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* 大字展示区 */}
      <div className="bg-gradient-to-br from-kid-bg via-white to-kid-yellow/30 p-8 text-center">
        <motion.div
          className="text-8xl font-bold text-gray-800 mb-2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          {character.char}
        </motion.div>
        <div className="flex justify-center items-center gap-3">
          <span className="text-kid-red font-bold text-xl">{character.pinyin}</span>
          <span className="bg-kid-orange/20 text-kid-orange text-xs font-bold px-2 py-1 rounded-full">
            {character.tone === 0 ? '轻声' : `第${character.tone}声`}
          </span>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors relative ${
              activeTab === tab.id ? 'text-kid-blue' : 'text-gray-400'
            }`}
          >
            {tab.icon} {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-kid-blue rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="p-5 min-h-[200px]">
        {activeTab === 'overview' && <Overview character={character} strokeCount={displayStrokeCount} />}
        {activeTab === 'stroke' && <StrokePlayer character={character} />}
        {activeTab === 'radical' && <RadicalExplorer character={character} />}
        {activeTab === 'story' && <CharacterStory character={character} />}
      </div>

      {/* 底部操作 */}
      <div className="p-4 border-t border-gray-100 flex gap-3">
        <button className="btn-primary flex-1 text-base">学会啦 ✓</button>
        <button className="btn-secondary flex-1 text-base">再练练</button>
      </div>
    </motion.div>
  )
}

function Overview({ character, strokeCount }: { character: Character; strokeCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3 text-center">
        <InfoBadge label="构字法" value={character.constructionType} color="kid-blue" />
        <InfoBadge label="笔画数" value={`${strokeCount} 画`} color="kid-green" />
        <InfoBadge label="部首" value={character.radical} color="kid-purple" />
        <InfoBadge label="主题" value={character.theme} color="kid-orange" />
      </div>

      {character.words.length > 0 && (
        <div>
          <div className="font-bold text-sm text-gray-500 mb-2">📝 组词</div>
          <div className="flex flex-wrap gap-2">
            {character.words.map((w, i) => (
              <span key={i} className="bg-kid-bg rounded-full px-3 py-1 text-sm font-bold">
                {w.word}
                <span className="text-gray-400 text-xs ml-1">{w.pinyin}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {character.sentence && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <div className="text-xs text-yellow-600 mb-1">📖 例句</div>
          <div className="text-sm">{character.sentence}</div>
        </div>
      )}
    </motion.div>
  )
}

function InfoBadge({ label, value, color }: { label: string; value: string; color: string }) {
  const bgMap: Record<string, string> = {
    'kid-blue': 'bg-kid-blue/10',
    'kid-green': 'bg-kid-green/10',
    'kid-purple': 'bg-kid-purple/10',
    'kid-orange': 'bg-kid-orange/10',
  }
  const textMap: Record<string, string> = {
    'kid-blue': 'text-kid-blue',
    'kid-green': 'text-kid-green',
    'kid-purple': 'text-kid-purple',
    'kid-orange': 'text-kid-orange',
  }
  return (
    <div className={`${bgMap[color] || 'bg-gray-50'} rounded-xl p-2`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`font-extrabold text-sm ${textMap[color] || ''}`}>
        {value}
      </div>
    </div>
  )
}
