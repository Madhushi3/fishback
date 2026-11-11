import express from 'express'
import { getPuzzle } from '../controllers/puzzleController.js'

const router = express.Router()

router.get('/', getPuzzle)

export default router

