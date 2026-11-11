import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DB_PATH = path.join(__dirname, 'database.json')

// Initial default seed data
const initialData = {
  users: [
    {
      id: 'usr_oceanhero_01',
      name: 'OceanHero',
      email: 'oceanhero@fishescape.io',
      // Password: "password123" (hashed or mock verified)
      passwordHash: '$2a$10$wOq2M0gG1bYfK8zM5H5ZweM2UfZk/F0rX8I7Y7hJkX5M0b2N9K1a2',
      avatar: '🤿',
      level: 3,
      experience: 620,
      score: 5210,
      coins: 250,
      role: 'student',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_marc_01',
      name: 'Marc',
      email: 'marc@fishescape.io',
      // Password: "hello26"
      passwordHash: '$2a$10$0z63e.eE3kRjVjS6d8q4xOFgD91qZ4E2A7vR0uV8S2sZfG8rA6vQ2',
      avatar: '🎓',
      level: 10,
      experience: 2500,
      score: 15000,
      coins: 999,
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_madhushi_01',
      name: 'Madhushi',
      email: 'madhushi@fishescape.io',
      avatar: '/game-assets/swimmer-avatar.png',
      level: 4,
      experience: 850,
      score: 1250,
      coins: 320,
      role: 'student',
      createdAt: new Date().toISOString(),
    },
  ],
  leaderboard: [
    { id: '1', name: 'GameMaster', score: 2450 },
    { id: '2', name: 'OceanHero', score: 2300 },
    { id: '3', name: 'FishLover', score: 2100 },
    { id: '4', name: 'Madhushi', score: 1250 },
    { id: '5', name: 'DreamPlayer', score: 1100 },
    { id: '6', name: 'BlueDiver', score: 950 },
    { id: '7', name: 'SeaExplorer', score: 870 },
    { id: '8', name: 'WaveRider', score: 720 },
  ],
  gameHistory: [
    { id: 'g1', playerName: 'Madhushi', date: 'Nov 8, 2026', score: 850, fishes: 5, treasures: 3, result: 'Won' },
    { id: 'g2', playerName: 'Madhushi', date: 'Nov 7, 2026', score: 620, fishes: 4, treasures: 2, result: 'Won' },
    { id: 'g3', playerName: 'Madhushi', date: 'Nov 6, 2026', score: 510, fishes: 3, treasures: 1, result: 'Won' },
  ],
}

class Store {
  constructor() {
    this.data = initialData
    this.load()
  }

  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8')
        this.data = JSON.parse(raw)
      } else {
        this.save()
      }
    } catch (err) {
      console.error('Error loading database.json, initializing with default data:', err.message)
      this.data = initialData
      this.save()
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8')
    } catch (err) {
      console.error('Failed to save to database.json:', err.message)
    }
  }
}

export const store = new Store()

