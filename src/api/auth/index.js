import { Router } from 'express'
import passport from '../../config/passport.js'

const router = Router()

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/denied' }),
  (req, res) => res.redirect('/')
)

router.get('/denied', (req, res) => {
  res.status(403).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Access Denied</title>
      <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center;
               justify-content: center; height: 100vh; margin: 0; background: #f5f7fa; }
        .box { text-align: center; background: white; padding: 48px; border-radius: 12px;
               box-shadow: 0 2px 16px rgba(0,0,0,.08); }
        h2 { color: #c0392b; margin-bottom: 8px; }
        p { color: #555; margin-bottom: 24px; }
        a { display: inline-block; padding: 10px 24px; background: #1a56db;
            color: white; border-radius: 6px; text-decoration: none; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>Access Denied</h2>
        <p>Only <strong>@prontomarketing.com</strong> accounts can access this page.</p>
        <a href="/auth/google">Try a different account</a>
      </div>
    </body>
    </html>
  `)
})

router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err)
    res.redirect('/auth/google')
  })
})

export default router
