import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Character } from '@/types'

interface Props {
  character: Character
}

export default function RadicalExplorer({ character }: Props) {
  const [revealed, setRevealed] = useState(false)

  const componentColors = ['bg-kid-red/20', 'bg-kid-blue/20', 'bg-kid-green/20', 'bg-kid-orange/20']

  return (
    <div className="text-center">
      <div className="bg-gray-50 rounded-2xl p-6 mb-4 min-h-[120px] flex items-center justify-center">
        {character.components.length > 0 ? (
          <div className="flex items-center gap-1">
            {character.components.map((comp, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -180 }}
                animate={revealed ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
                transition={{ type: 'spring', delay: i * 0.15 }}
                className={`text-5xl font-bold px-3 py-2 rounded-xl ${componentColors[i % componentColors.length]} cursor-default`}
                title={`${comp.role}: ${comp.char}`}
              >
                {comp.char}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800 mb-3">{character.char}</div>
            <p className="text-sm text-gray-400">这是一个{character.constructionType}字</p>
            <p className="text-xs text-gray-400 mt-1">部首：{character.radical}（{character.radicalName}）</p>
          </div>
        )}
      </div>

      {character.components.length > 0 && !revealed && (
        <motion.button
          onClick={() => setRevealed(true)}
          className="btn-primary text-sm px-6 py-2"
          whileTap={{ scale: 0.9 }}
        >
          🔍 点击拆解
        </motion.button>
      )}

      {revealed && character.components.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 space-y-2"
        >
          <div className="flex justify-center items-center gap-3">
            {character.components.map((comp, i) => (
              <motion.span
                key={i}
                className={`text-sm font-bold px-3 py-1 rounded-full ${componentColors[i % componentColors.length]}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 + 0.5 }}
              >
                {comp.char} ({comp.role})
              </motion.span>
            ))}
          </div>
          <p className="text-sm text-gray-500">
            {character.char} = {character.components.map((c) => c.char).join(' + ')}
          </p>
        </motion.div>
      )}
    </div>
  )
}
