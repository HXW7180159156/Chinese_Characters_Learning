import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

let db: Database.Database

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'hanzi-learning.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '🐼',
      age_group TEXT NOT NULL DEFAULT '5-6',
      daily_time_limit INTEGER NOT NULL DEFAULT 30,
      daily_word_goal INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      profile_id TEXT NOT NULL,
      char_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      review_count INTEGER NOT NULL DEFAULT 0,
      correct_count INTEGER NOT NULL DEFAULT 0,
      last_reviewed TEXT,
      mastery_level INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (profile_id, char_id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      profile_id TEXT NOT NULL,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (profile_id, achievement_id),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      profile_id TEXT NOT NULL,
      date TEXT NOT NULL,
      study_seconds INTEGER NOT NULL DEFAULT 0,
      words_learned INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (profile_id, date),
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    );
  `)
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}

// Profile operations
export function getProfiles() {
  return db.prepare('SELECT * FROM profiles ORDER BY created_at DESC').all()
}

export function getProfile(id: string) {
  return db.prepare('SELECT * FROM profiles WHERE id = ?').get(id)
}

export function createProfile(profile: {
  id: string; name: string; avatar: string; ageGroup: string;
  dailyTimeLimit: number; dailyWordGoal: number;
}) {
  return db.prepare(`
    INSERT INTO profiles (id, name, avatar, age_group, daily_time_limit, daily_word_goal)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(profile.id, profile.name, profile.avatar, profile.ageGroup, profile.dailyTimeLimit, profile.dailyWordGoal)
}

export function updateProfile(id: string, data: Record<string, unknown>) {
  const fields = Object.keys(data).map((k) => `${k} = ?`).join(', ')
  const values = Object.values(data)
  return db.prepare(`UPDATE profiles SET ${fields} WHERE id = ?`).run(...values, id)
}

export function deleteProfile(id: string) {
  return db.prepare('DELETE FROM profiles WHERE id = ?').run(id)
}

// Progress operations
export function getProgress(profileId: string) {
  return db.prepare('SELECT * FROM learning_progress WHERE profile_id = ?').all(profileId)
}

export function updateProgress(profileId: string, charId: number, data: {
  status?: string; reviewCount?: number; correctCount?: number;
  lastReviewed?: string; masteryLevel?: number;
}) {
  const existing = db.prepare(
    'SELECT * FROM learning_progress WHERE profile_id = ? AND char_id = ?'
  ).get(profileId, charId)

  if (existing) {
    const sets: string[] = []
    const values: unknown[] = []
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        sets.push(`${k} = ?`)
        values.push(v)
      }
    }
    if (sets.length === 0) return
    return db.prepare(
      `UPDATE learning_progress SET ${sets.join(', ')} WHERE profile_id = ? AND char_id = ?`
    ).run(...values, profileId, charId)
  } else {
    return db.prepare(`
      INSERT INTO learning_progress (profile_id, char_id, status, review_count, correct_count, last_reviewed, mastery_level)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      profileId, charId,
      data.status || 'new',
      data.reviewCount || 0,
      data.correctCount || 0,
      data.lastReviewed || null,
      data.masteryLevel || 0,
    )
  }
}

// Stats operations
export function getDailyStats(profileId: string, days: number = 7) {
  return db.prepare(`
    SELECT * FROM daily_stats
    WHERE profile_id = ? AND date >= date('now', '-' || ? || ' days')
    ORDER BY date DESC
  `).all(profileId, days)
}

export function updateDailyStats(profileId: string, date: string, data: {
  studySeconds?: number; wordsLearned?: number; gamesPlayed?: number;
}) {
  const existing = db.prepare(
    'SELECT * FROM daily_stats WHERE profile_id = ? AND date = ?'
  ).get(profileId, date)

  if (existing) {
    const sets: string[] = []
    const values: unknown[] = []
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) {
        sets.push(`${k} = ${k} + ?`)
        values.push(v)
      }
    }
    if (sets.length === 0) return
    return db.prepare(
      `UPDATE daily_stats SET ${sets.join(', ')} WHERE profile_id = ? AND date = ?`
    ).run(...values, profileId, date)
  } else {
    return db.prepare(`
      INSERT INTO daily_stats (profile_id, date, study_seconds, words_learned, games_played)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      profileId, date,
      data.studySeconds || 0,
      data.wordsLearned || 0,
      data.gamesPlayed || 0,
    )
  }
}

// Achievement operations
export function getAchievements(profileId: string) {
  return db.prepare('SELECT * FROM achievements WHERE profile_id = ?').all(profileId)
}

export function unlockAchievement(profileId: string, achievementId: string) {
  return db.prepare(`
    INSERT OR IGNORE INTO achievements (profile_id, achievement_id)
    VALUES (?, ?)
  `).run(profileId, achievementId)
}
