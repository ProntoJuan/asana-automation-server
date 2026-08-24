import path from 'path'
import { fileURLToPath } from 'url'
import healthcheckRouter from './api/healthcheck/index.js'
import webhookRouter from './api/webhook/index.js'
import authRouter from './api/auth/index.js'
import uiRouter from './api/ui/index.js'
import { checkAuthenticated } from './middlewares/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function routes (app) {
  app.use('/auth', authRouter)
  app.use('/api/healthcheck', healthcheckRouter)
  app.use('/api/webhook', webhookRouter)
  app.use('/ui', checkAuthenticated, uiRouter)

  app.get('/login', (req, res) => {
    if (req.isAuthenticated()) return res.redirect('/')
    res.sendFile(path.join(__dirname, '../public/login.html'))
  })

  app.get('/', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'))
  })

  app.get('/register', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/register.html'))
  })

  app.get('/debug', checkAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/debug.html'))
  })
}

export default routes
