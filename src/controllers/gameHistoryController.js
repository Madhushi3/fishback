import mongoose from 'mongoose'
import { store } from '../data/store.js'
import GameHistory from '../models/GameHistory.js'
import User from '../models/User.js'

export const getGameHistory = async (req, res, next) => {
  try {
    const { playerName } = req.query

    // MongoDB Mode
    if (mongoose.connection.readyState === 1) {
      const query = playerName ? { playerName: new RegExp(`^${playerName}$`, 'i') } : {}
      const history = await GameHistory.find(query).sort({ createdAt: -1 }).limit(20).lean()

      const formatted = history.map((h) => ({
        id: h._id,
        playerName: h.playerName,
        date: h.date,
        score: h.score,
        fishes: h.fishes,
        treasures: h.treasures,
        result: h.result,
      }))

      return res.json({
        success: true,
        data: formatted,
      })
    }

    // Fallback JSON Store Mode
    let history = [...store.data.gameHistory]
    if (playerName) {
      history = history.filter((h) => h.playerName?.toLowerCase() === playerName.toLowerCase())
    }

    res.json({
      success: true,
      data: history.slice(0, 20),
    })
  } catch (error) {
    next(error)
  }
}

export const recordGame = async (req, res, next) => {
  try {
    const { playerName = 'Madhushi', score, fishes, treasures, result } = req.body

    const formattedDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    // MongoDB Mode
    if (mongoose.connection.readyState === 1) {
      // Deduplicate rapid duplicate submissions (within last 4 seconds)
      const fourSecAgo = new Date(Date.now() - 4000)
      const recentDuplicate = await GameHistory.findOne({
        playerName: new RegExp(`^${playerName}$`, 'i'),
        score: score || 0,
        fishes: fishes || 0,
        treasures: treasures || 0,
        createdAt: { $gte: fourSecAgo },
      })

      if (recentDuplicate) {
        return res.status(200).json({
          success: true,
          message: 'Game already recorded (deduplicated)',
          data: {
            id: recentDuplicate._id,
            playerName: recentDuplicate.playerName,
            date: recentDuplicate.date,
            score: recentDuplicate.score,
            fishes: recentDuplicate.fishes,
            treasures: recentDuplicate.treasures,
            result: recentDuplicate.result,
          },
        })
      }

      const newGame = await GameHistory.create({
        playerName,
        date: formattedDate,
        score: score || 0,
        fishes: fishes || 0,
        treasures: treasures || 0,
        result: result || 'Ended',
      })

      // Update player totals in User collection if registered
      await User.findOneAndUpdate(
        { name: new RegExp(`^${playerName}$`, 'i') },
        {
          $inc: { totalFish: fishes || 0, totalTreasures: treasures || 0 },
          $max: { score: score || 0 },
        }
      )

      return res.status(201).json({
        success: true,
        message: 'Game recorded successfully (MongoDB)',
        data: {
          id: newGame._id,
          playerName: newGame.playerName,
          date: newGame.date,
          score: newGame.score,
          fishes: newGame.fishes,
          treasures: newGame.treasures,
          result: newGame.result,
        },
      })
    }

    // Fallback JSON Store Mode
    const lastEntry = store.data.gameHistory[0]
    if (
      lastEntry &&
      lastEntry.playerName?.toLowerCase() === playerName.toLowerCase() &&
      lastEntry.score === (score || 0) &&
      lastEntry.fishes === (fishes || 0) &&
      lastEntry.treasures === (treasures || 0)
    ) {
      return res.status(200).json({
        success: true,
        message: 'Game already recorded',
        data: lastEntry,
      })
    }
    const newGame = {
      id: 'game_' + Date.now(),
      playerName,
      date: formattedDate,
      score: score || 0,
      fishes: fishes || 0,
      treasures: treasures || 0,
      result: result || 'Ended',
    }

    store.data.gameHistory.unshift(newGame)

    const user = store.data.users.find((u) => u.name.toLowerCase() === playerName.toLowerCase())
    if (user) {
      user.totalFish = (user.totalFish || 0) + (fishes || 0)
      user.totalTreasures = (user.totalTreasures || 0) + (treasures || 0)
      user.score = Math.max(user.score || 0, score || 0)
    }

    store.save()

    res.status(201).json({
      success: true,
      message: 'Game recorded successfully',
      data: newGame,
    })
  } catch (error) {
    next(error)
  }
}
