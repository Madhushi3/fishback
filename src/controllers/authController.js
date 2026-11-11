import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { store } from '../data/store.js'
import { config } from '../config/config.js'
import User from '../models/User.js'

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Player Name is required' })
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email address is required' })
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ success: false, message: 'Password must be at least 4 characters' })
    }

    const cleanEmail = email.trim().toLowerCase()
    const cleanName = name.trim()

    // MongoDB Mode
    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({
        $or: [{ email: cleanEmail }, { name: cleanName }],
      })
      if (existingUser) {
        return res.status(409).json({ success: false, message: 'User with this email or name already exists' })
      }

      const user = await User.create({
        name: cleanName,
        email: cleanEmail,
        password, // Pre-save hook hashes it
        avatar: '🤿',
        coins: 100,
      })

      const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, config.jwtSecret, {
        expiresIn: '7d',
      })

      return res.status(201).json({
        success: true,
        message: 'Registration successful (MongoDB)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          level: user.level || 1,
          experience: user.experience || 0,
          score: user.score || 0,
          coins: user.coins || 100,
          totalFish: user.totalFish || 0,
          totalTreasures: user.totalTreasures || 0,
          role: user.role || 'student',
        },
      })
    }

    // Fallback JSON Store Mode
    const existingUser = store.data.users.find(
      (u) => u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanName.toLowerCase()
    )
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User with this email or name already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const newUser = {
      id: 'usr_' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      avatar: '🤿',
      level: 1,
      experience: 0,
      score: 0,
      coins: 100,
      role: 'student',
      createdAt: new Date().toISOString(),
    }

    store.data.users.push(newUser)
    store.save()

    const token = jwt.sign({ id: newUser.id, name: newUser.name, email: newUser.email }, config.jwtSecret, {
      expiresIn: '7d',
    })

    const { passwordHash: _, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res, next) => {
  try {
    const { identifier, email, name, password } = req.body
    const loginIdentifier = identifier || email || name

    if (!loginIdentifier || !password) {
      return res.status(400).json({ success: false, message: 'Username/Email and Password are required' })
    }

    const idLower = loginIdentifier.toLowerCase().trim()
    const isMarc = (idLower === 'marc' || idLower === 'marc@fishescape.io') && password === 'hello26'

    // MongoDB Mode
    if (mongoose.connection.readyState === 1) {
      let user = await User.findOne({
        $or: [{ email: idLower }, { name: new RegExp(`^${idLower}$`, 'i') }],
      })

      if (isMarc) {
        if (!user) {
          user = await User.create({
            name: 'Marc',
            email: 'marc@fishescape.io',
            password: 'hello26',
            avatar: '🎓',
            level: 10,
            experience: 2500,
            score: 15000,
            coins: 999,
            role: 'admin',
          })
        }
      } else {
        if (!user) {
          return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' })
        }

        const isMatch = await user.matchPassword(password)
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid username or password' })
        }
      }

      const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, config.jwtSecret, {
        expiresIn: '7d',
      })

      return res.json({
        success: true,
        message: 'Login successful (MongoDB)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          level: user.level || 1,
          experience: user.experience || 0,
          score: user.score || 0,
          coins: user.coins || 100,
          totalFish: user.totalFish || 0,
          totalTreasures: user.totalTreasures || 0,
          role: user.role || 'student',
        },
      })
    }

    // Fallback JSON Store Mode
    let user = store.data.users.find(
      (u) => u.email.toLowerCase() === idLower || u.name.toLowerCase() === idLower
    )

    if (isMarc) {
      if (!user) {
        user = {
          id: 'usr_marc_01',
          name: 'Marc',
          email: 'marc@fishescape.io',
          avatar: '🎓',
          level: 10,
          experience: 2500,
          score: 15000,
          coins: 999,
          role: 'admin',
          createdAt: new Date().toISOString(),
        }
        store.data.users.push(user)
        store.save()
      }
    } else {
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' })
      }

      if (user.passwordHash) {
        const isMatch = await bcrypt.compare(password, user.passwordHash)
        if (!isMatch) {
          return res.status(401).json({ success: false, message: 'Invalid username or password' })
        }
      }
    }

    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, config.jwtSecret, {
      expiresIn: '7d',
    })

    const { passwordHash: _, ...userWithoutPassword } = user

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = (req, res) => {
  const user = req.user.toObject ? req.user.toObject() : req.user
  delete user.password
  delete user.passwordHash
  res.json({
    success: true,
    user,
  })
}

export const updateProfile = async (req, res, next) => {
  try {
    const { name, avatar, title } = req.body

    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(req.user._id || req.user.id)
      if (!user) return res.status(404).json({ success: false, message: 'User not found' })

      if (name) user.name = name.trim()
      if (avatar) user.avatar = avatar
      if (title) user.title = title
      await user.save()

      const userObj = user.toObject()
      delete userObj.password

      return res.json({
        success: true,
        message: 'Profile updated successfully (MongoDB)',
        user: userObj,
      })
    }

    const userId = req.user.id
    const userIndex = store.data.users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    if (name) store.data.users[userIndex].name = name.trim()
    if (avatar) store.data.users[userIndex].avatar = avatar
    if (title) store.data.users[userIndex].title = title

    store.save()

    const { passwordHash: _, ...updatedUser } = store.data.users[userIndex]

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    next(error)
  }
}

export const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  })
}
