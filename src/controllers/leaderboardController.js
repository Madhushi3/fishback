import mongoose from 'mongoose'
import { store } from '../data/store.js'
import Leaderboard from '../models/Leaderboard.js'
import User from '../models/User.js'

export const getLeaderboard = async (req, res, next) => {
  try {
    const { playerName = 'Madhushi' } = req.query
    const cleanCurrentPlayer = (playerName || '').trim()

    // Default community leaderboard players
    const defaultChampions = [
      { name: 'GameMaster', score: 2450 },
      { name: 'OceanHero', score: 2300 },
      { name: 'FishLover', score: 2100 },
      { name: 'DreamPlayer', score: 1100 },
      { name: 'BlueDiver', score: 950 },
      { name: 'SeaExplorer', score: 870 },
      { name: 'WaveRider', score: 720 },
    ]

    // MongoDB Mode
    if (mongoose.connection.readyState === 1) {
      const rawEntries = await Leaderboard.find().lean()
      const registeredUsers = await User.find().select('name score').lean()

      // Deduplicate into a clean Map by lowercase player name
      const playerMap = new Map()

      // 1. Add default champions first
      for (const champ of defaultChampions) {
        playerMap.set(champ.name.toLowerCase(), {
          id: `champ_${champ.name.toLowerCase()}`,
          name: champ.name,
          score: champ.score,
        })
      }

      // 2. Merge existing database entries (keeping highest score per unique name)
      for (const entry of rawEntries) {
        if (!entry.name) continue
        const key = entry.name.toLowerCase().trim()
        const existing = playerMap.get(key)
        if (!existing || entry.score > existing.score) {
          playerMap.set(key, {
            id: entry._id.toString(),
            name: entry.name,
            score: entry.score || 0,
          })
        }
      }

      // 3. Merge registered users with real scores
      for (const u of registeredUsers) {
        if (!u.name) continue
        const key = u.name.toLowerCase().trim()
        const userScore = u.score || 0
        const existing = playerMap.get(key)
        if (!existing) {
          playerMap.set(key, {
            id: u._id.toString(),
            name: u.name,
            score: userScore,
          })
        } else {
          existing.name = u.name
          existing.score = Math.max(existing.score, userScore)
        }
      }

      // 4. Ensure active player is present with their latest score
      if (cleanCurrentPlayer) {
        const activeKey = cleanCurrentPlayer.toLowerCase()
        const registered = registeredUsers.find((u) => u.name?.toLowerCase().trim() === activeKey)
        const activeScore = registered?.score || 0
        const existing = playerMap.get(activeKey)
        if (!existing) {
          playerMap.set(activeKey, {
            id: `player_${Date.now()}`,
            name: cleanCurrentPlayer,
            score: activeScore,
          })
        } else {
          existing.name = cleanCurrentPlayer
          existing.score = Math.max(existing.score, activeScore)
        }
      }

      // 5. Sort descending by score cleanly
      const sorted = Array.from(playerMap.values()).sort((a, b) => b.score - a.score)

      // 6. Rank from 1 to N
      const ranked = sorted.map((item, index) => ({
        id: item.id || `rank_${index + 1}`,
        rank: index + 1,
        name: item.name,
        score: item.score,
        isCurrentPlayer: cleanCurrentPlayer ? item.name.toLowerCase().trim() === cleanCurrentPlayer.toLowerCase() : false,
      }))

      return res.json({
        success: true,
        data: ranked,
      })
    }

    // Fallback JSON Store Mode
    const playerMap = new Map()
    for (const champ of defaultChampions) {
      playerMap.set(champ.name.toLowerCase(), { ...champ, id: champ.name })
    }
    for (const item of store.data.leaderboard) {
      if (!item.name) continue
      const key = item.name.toLowerCase().trim()
      const existing = playerMap.get(key)
      if (!existing || item.score > existing.score) {
        playerMap.set(key, { ...item, name: item.name, score: item.score || 0 })
      }
    }

    const sorted = Array.from(playerMap.values()).sort((a, b) => b.score - a.score)
    const rankedList = sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
      isCurrentPlayer: cleanCurrentPlayer ? item.name.toLowerCase().trim() === cleanCurrentPlayer.toLowerCase() : false,
    }))

    res.json({
      success: true,
      data: rankedList,
    })
  } catch (error) {
    next(error)
  }
}

export const submitScore = async (req, res, next) => {
  try {
    const { playerName, score } = req.body

    if (!playerName || typeof score !== 'number') {
      return res.status(400).json({ success: false, message: 'playerName and numeric score are required' })
    }

    const cleanName = playerName.trim()

    // MongoDB Mode
    if (mongoose.connection.readyState === 1) {
      // Case-insensitive lookup so no duplicate variants are ever created
      const existing = await Leaderboard.findOne({
        name: new RegExp(`^${cleanName}$`, 'i'),
      })

      if (existing) {
        if (score > existing.score) {
          existing.score = score
          existing.name = cleanName
          await existing.save()
        }
      } else {
        await Leaderboard.create({ name: cleanName, score })
      }

      // Also update user profile score if registered
      await User.findOneAndUpdate(
        { name: new RegExp(`^${cleanName}$`, 'i') },
        { $max: { score: score } }
      )

      return res.json({
        success: true,
        message: 'Score submitted successfully (MongoDB)',
      })
    }

    // Fallback JSON Store Mode
    const cleanLower = cleanName.toLowerCase()
    const existingIndex = store.data.leaderboard.findIndex(
      (e) => e.name.toLowerCase() === cleanLower
    )

    if (existingIndex >= 0) {
      if (score > store.data.leaderboard[existingIndex].score) {
        store.data.leaderboard[existingIndex].score = score
      }
    } else {
      store.data.leaderboard.push({
        id: 'score_' + Date.now(),
        name: cleanName,
        score,
      })
    }

    const user = store.data.users.find((u) => u.name.toLowerCase() === cleanLower)
    if (user) {
      user.score = Math.max(user.score || 0, score)
    }

    store.save()

    res.json({
      success: true,
      message: 'Score submitted successfully',
    })
  } catch (error) {
    next(error)
  }
}
