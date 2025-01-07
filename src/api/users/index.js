import { Router } from 'express'
import { meHandler, getUserByIdHandler } from './users.controller.js'
import { checkAuthenticated } from '../../middlewares/auth.js'

const router = Router()

router.get('/me', checkAuthenticated, meHandler)

router.get('/:id', checkAuthenticated, getUserByIdHandler)

export default router
