import mongoose from 'mongoose'

const leaderboardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    score: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
)

export const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema)
export default Leaderboard

