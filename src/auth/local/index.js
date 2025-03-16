import { Router } from 'express'
import { loginLocalHandler, registerLocalHandler, protectedHandler } from './local.controller.js'
import { isAuthenticated } from '../auth.middlewares.js'

const router = Router()

router.get('/', (req, res) => {
  res.status(200).json({ message: 'Local auth' })
})

router.post('/login', loginLocalHandler)

router.post('/register', registerLocalHandler)

router.post('/logout', (req, res) => {

})

router.get('/protected', isAuthenticated, protectedHandler)

export default router
