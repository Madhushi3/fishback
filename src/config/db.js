import mongoose from 'mongoose'
import { config } from './config.js'

export const connectDB = async () => {
  const uri = config.mongoUri || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fishgame'

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    })
    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`)
    return true
  } catch (error) {
    console.warn(`⚠️  MongoDB Connection Warning: ${error.message}`)
    console.warn(`👉 Tip: Make sure MongoDB is running locally (mongodb://127.0.0.1:27017) or provide a MongoDB Atlas cloud URI in .env`)
    return false
  }
}
