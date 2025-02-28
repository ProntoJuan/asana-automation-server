import { Router } from 'express'
import passport from 'passport'
import { asanaAuthFailHandler } from './passport.controller.js'

const router = Router()

router.get('/', passport.authenticate('Asana'))

router.get(
  '/callback',
  passport.authenticate('Asana', { failureRedirect: '/login' }), asanaAuthFailHandler
)

router.get('/check', (req, res) => {
  if (req.isAuthenticated()) {
    const user = {
      name: req.user._json.name,
      email: req.user._json.email
    }

    res.status(200).json({ message: 'Authenticated', user })
  } else {
    res.status(401).json({ message: 'Not authenticated' })
  }
})

export default router
