import { Router } from 'express'
import { getProjectByIdHandler } from './projects.controller.js'

const router = Router()

router.get('/:id', getProjectByIdHandler)

export default router
