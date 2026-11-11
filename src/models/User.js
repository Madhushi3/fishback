import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Player Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 4,
    },
    avatar: {
      type: String,
      default: '🤿',
    },
    title: {
      type: String,
      default: '⭐ Pro Swimmer',
    },
    level: {
      type: Number,
      default: 1,
    },
    experience: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    coins: {
      type: Number,
      default: 100,
    },
    totalFish: {
      type: Number,
      default: 0,
    },
    totalTreasures: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'guest'],
      default: 'student',
    },
  },
  {
    timestamps: true,
  }
)

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Match password helper
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

export const User = mongoose.model('User', userSchema)
export default User

