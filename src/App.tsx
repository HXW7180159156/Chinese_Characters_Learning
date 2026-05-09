import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import LearnPage from './pages/LearnPage'
import PracticePage from './pages/PracticePage'
import ParentPage from './pages/ParentPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import { getAllCharacters } from '@data/index'

function App() {
  useEffect(() => { getAllCharacters() }, [])
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/learn/:levelId?" element={<LearnPage />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/parent" element={<ParentPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
