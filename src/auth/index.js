import { Router } from 'express'
import passport from 'passport'
import { asanaAuthFailHandler } from './passport/passport.controller.js'

const router = Router()

router.get('/', (req, res) => { res.status(200).json('Auth') })
router.get('/asana', passport.authenticate('Asana'))
router.get(
  '/asana/callback',
  passport.authenticate('Asana', { failureRedirect: '/login' }), asanaAuthFailHandler
)

export default router
