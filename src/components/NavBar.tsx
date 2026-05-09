import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const tabs = [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/learn', icon: '📖', label: '学习' },
  { path: '/practice', icon: '🎮', label: '练习' },
  { path: '/parent', icon: '👨‍👩‍👧', label: '家长' },
  { path: '/profile', icon: '👤', label: '我的' },
]

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-100 px-2 py-1 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path)
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="relative flex flex-col items-center py-1 px-3 min-w-0"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-kid-orange"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-2xl">{tab.icon}</span>
              <span className={`text-xs mt-0.5 font-semibold ${active ? 'text-kid-orange' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
