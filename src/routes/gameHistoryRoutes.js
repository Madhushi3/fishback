import express from 'express'
import { getGameHistory, recordGame } from '../controllers/gameHistoryController.js'

const router = express.Router()

router.get('/', getGameHistory)
router.post('/', recordGame)

export default router

