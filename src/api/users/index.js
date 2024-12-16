import { Router } from 'express'
import { meHandler, getUserByIdHandler } from './users.controller.js'

const router = Router()

router.get('/me', meHandler)

router.get('/:id', getUserByIdHandler)

export default router
