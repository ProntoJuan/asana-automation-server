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
      <link rel="icon" type="image/svg+xml" href="/favicon.svg">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; display: flex; align-items: center;
               justify-content: center; height: 100vh; margin: 0; background: #162447; }
        .box { text-align: center; background: white; padding: 48px; border-radius: 16px;
               box-shadow: 0 24px 64px rgba(0,0,0,.35); max-width: 380px; width: 100%; margin: 24px; }
        h2 { color: #c0392b; margin-bottom: 8px; font-size: 18px; }
        p { color: #6b7280; margin-bottom: 24px; font-size: 14px; }
        a { display: inline-block; padding: 10px 24px; background: #139be8;
            color: white; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2>Access Denied</h2>
        <p>Only <strong>@prontomarketing.com</strong> accounts can access this page.</p>
        <a href="/login">Try a different account</a>
      </div>
    </body>
    </html>
  `)
})

router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err)
    res.redirect('/login')
  })
})

export default router
