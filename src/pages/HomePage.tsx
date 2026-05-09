import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { levelMeta } from '@data/index'

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06 },
  },
}

const item = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1 },
}

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="pt-6 pb-4">
      <div className="text-center mb-6">
        <motion.h1
          className="text-3xl font-extrabold text-kid-red mb-1"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          🌟 汉字小探险 🌟
        </motion.h1>
        <motion.p
          className="text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          由简到繁，循序渐进，探索汉字的奇妙世界
        </motion.p>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-3 max-w-md mx-auto"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {levelMeta.map((level) => (
          <motion.button
            key={level.id}
            variants={item}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/learn/${level.id}`)}
            className={`${level.color} rounded-2xl p-4 text-white text-left shadow-lg cursor-pointer`}
          >
            <div className="text-3xl mb-2">{level.emoji}</div>
            <div className="font-extrabold text-sm">{level.title}</div>
            <div className="text-xs opacity-80">{level.subtitle}</div>
            <div className="mt-2 flex justify-between items-center text-xs opacity-70">
              <span>{level.chars} 字</span>
              <span>Level {level.id}</span>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </div>
  )
}
