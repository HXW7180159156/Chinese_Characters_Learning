import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <div className="flex flex-col h-screen">
      <main className="flex-1 overflow-y-auto px-4 pb-20">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
      <NavBar />
    </div>
  )
}
