import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { config } from '../config/config.js'
import { store } from '../data/store.js'
import User from '../models/User.js'

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization']
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied: No token provided' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    let user = null

    if (mongoose.connection.readyState === 1) {
      user = await User.findById(decoded.id).select('-password')
    } else {
      user = store.data.users.find((u) => u.id === decoded.id || u._id === decoded.id)
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User belonging to this token no longer exists' })
    }

    req.user = user
    next()
  } catch {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' })
  }
}
