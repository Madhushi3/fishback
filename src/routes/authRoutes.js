import express from 'express'
import { register, login, getMe, updateProfile, logout } from '../controllers/authController.js'
import { authenticateToken } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', authenticateToken, getMe)
router.put('/profile', authenticateToken, updateProfile)
router.post('/logout', logout)

export default router

