import { useState, useEffect } from 'react'
import type { Character } from '@/types'
import { getCharactersByLevel, getAllCharacters, getLoadedAllCharacters } from '@data/index'

export function useLevelCharacters(level: number) {
  const [chars, setChars] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getCharactersByLevel(level).then((data) => {
      if (!cancelled) {
        setChars(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [level])

  return { chars, loading }
}

let allCharsPromise: Promise<Character[]> | null = null

export function useAllCharacters() {
  const [chars, setChars] = useState<Character[]>(getLoadedAllCharacters)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = getLoadedAllCharacters()
    if (cached.length > 0) {
      setChars(cached)
      setLoading(false)
      return
    }
    if (!allCharsPromise) {
      allCharsPromise = getAllCharacters()
    }
    let cancelled = false
    allCharsPromise.then((data) => {
      if (!cancelled) {
        setChars(data)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

  return { chars, loading }
}
