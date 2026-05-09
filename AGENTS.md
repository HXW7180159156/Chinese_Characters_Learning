# AGENTS.md — 汉字学习 Electron App

## Core stack
- Electron 28 + React 19 + TypeScript + Vite 5 + Tailwind CSS 3
- State: Zustand
- Animation: Framer Motion
- Routing: react-router-dom v6 (HashRouter)
- Font: Nunito (Google Fonts) + system Chinese fonts

## Scripts
```bash
npm run dev        # Vite dev + auto-launch Electron
npm run build      # Vite build + tsc electron + electron-builder
npm run typecheck  # tsc --noEmit  (lint = typecheck alias)
```

## Architecture
```
electron/          # Main process (tsc -> dist-electron/)
src/               # Renderer process (Vite -> dist/)
data/              # Character JSON data (10 levels, 800 chars)
```

- Electron loads `http://localhost:5173` in dev, `dist/index.html` in prod
- HashRouter is required for Electron file:// loading
- `@/` aliases to `src/`, `@data/` to `data/`

## Key paths
- Config: `vite.config.ts`, `tsconfig.json`, `tsconfig.electron.json`, `tailwind.config.ts`
- Entry: `index.html` -> `src/main.tsx` -> `src/App.tsx`
- Electron: `electron/main.ts` (compiled to `dist-electron/main.js`)

## Data model (src/types/index.ts)
- `Character`: id, char, pinyin, tone, radical, constructionType (象形|指事|会意|形声), level(1-10), theme, components, words, etymology, funFact
- `LearningProgress`: per-char mastery tracking
- `UserProfile`: child profile with ageGroup, dailyTimeLimit, dailyWordGoal

## Store patterns (Zustand)
- `profileStore.ts` — multi-profile management
- `learningStore.ts` — learning progress Map<number, Progress>
- `settingsStore.ts` — sound, fontSize, theme

## Component conventions
- Use `motion.div` from framer-motion for all animated content
- Use Tailwind color tokens: `kid-red`, `kid-orange`, `kid-yellow`, `kid-green`, `kid-blue`, `kid-purple`, `kid-pink`, `kid-bg`
- Use `card-kid` class for card containers, `btn-kid`/`btn-primary`/`btn-secondary` for buttons
- All routes use the Layout component which provides NavBar

## Project plan phases
1. Project init & scaffolding ✓
2. Type definitions + Level 1-3 character data ✓
3. SQLite local DB integration (better-sqlite3) ✓
4. Complete game modules (puzzle, sort, match, writing, listen) ✓
5. Level 4-10 data population
6. Optional backend sync + packaging
