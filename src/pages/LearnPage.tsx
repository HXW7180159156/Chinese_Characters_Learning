import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import CharacterCard from '@/components/CharacterCard/CharacterCard'
import type { Character } from '@/types'
import { getLevelName } from '@data/index'
import { useLevelCharacters } from '@/hooks/useCharacterData'

export default function LearnPage() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const [selectedChar, setSelectedChar] = useState<Character | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid')

  const level = Number(levelId || '1')
  const { chars: currentChars, loading } = useLevelCharacters(level)

  const handleCharClick = (char: Character) => {
    setSelectedChar(char)
    setViewMode('detail')
  }

  const handleBack = () => {
    setViewMode('grid')
    setSelectedChar(null)
  }

  return (
    <div className="pt-6 pb-4">
      {viewMode === 'detail' && selectedChar ? (
        <div>
          <button onClick={handleBack} className="text-kid-blue font-bold mb-4 flex items-center gap-1 text-lg">
            ← 返回列表
          </button>
          <CharacterCard character={selectedChar} />
        </div>
      ) : (
        <div>
          <button onClick={() => navigate('/')} className="text-kid-blue font-bold mb-3 flex items-center gap-1">
            ← 回到首页
          </button>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">📖</span>
            <div>
              <h1 className="text-xl font-extrabold text-gray-800">
                {getLevelName(Number(level))}
              </h1>
              <p className="text-sm text-gray-500">共 {currentChars.length} 个字</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">加载中...</div>
          ) : (
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
            {currentChars.map((char, i) => (
              <motion.button
                key={char.id}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleCharClick(char)}
                className="card-kid aspect-square flex flex-col items-center justify-center p-2 hover:border-kid-blue"
              >
                <span className="text-4xl font-bold mb-1">{char.char}</span>
                <span className="text-xs text-gray-400">{char.pinyin}</span>
              </motion.button>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  )
}
