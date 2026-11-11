import mongoose from 'mongoose'

const gameHistorySchema = new mongoose.Schema(
  {
    playerName: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      default: () => new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    fishes: {
      type: Number,
      default: 0,
    },
    treasures: {
      type: Number,
      default: 0,
    },
    result: {
      type: String,
      enum: ['Won', 'Ended'],
      default: 'Ended',
    },
  },
  {
    timestamps: true,
  }
)

export const GameHistory = mongoose.model('GameHistory', gameHistorySchema)
export default GameHistory

