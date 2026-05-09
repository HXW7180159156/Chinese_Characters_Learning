import { motion } from 'framer-motion'
import type { Character } from '@/types'

interface Props {
  character: Character
}

export default function CharacterStory({ character }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* 字源故事 */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="text-kid-blue font-bold text-sm mb-2">📖 字源故事</div>
        <p className="text-sm text-gray-700 leading-relaxed">{character.etymology}</p>
      </div>

      {/* 构字法说明 */}
      <div className="bg-purple-50 rounded-xl p-4">
        <div className="text-kid-purple font-bold text-sm mb-2">🏗️ 构字法：{character.constructionType}</div>
        <p className="text-xs text-gray-600">
          {character.constructionType === '象形' && '象形字是把事物的样子画下来变成字，是最古老的造字方法。'}
          {character.constructionType === '指事' && '指事字是用简单符号表示抽象意思，比如上下左右。'}
          {character.constructionType === '会意' && '会意字是把两个或多个字的意思组合起来，表示新意思。'}
          {character.constructionType === '形声' && '形声字由形旁（表意）和声旁（表音）组成，是最多的一类字。'}
        </p>
      </div>

      {/* 趣味常识 */}
      <div className="bg-green-50 rounded-xl p-4">
        <div className="text-kid-green font-bold text-sm mb-2">💡 趣味常识</div>
        <p className="text-sm text-gray-700 leading-relaxed">{character.funFact}</p>
      </div>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2">
        {character.tags.map((tag, i) => (
          <span key={i} className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
            #{tag}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
