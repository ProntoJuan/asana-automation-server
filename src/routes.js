import healthcheckRouter from './api/healthcheck/index.js'
import webhookRouter from './api/webhook/index.js'
import authAsanaRouter from './auth/passport/index.js'
import authLocalRouter from './auth/local/index.js'
import usersRouter from './api/users/index.js'
import projectsRouter from './api/projects/index.js'

function routes (app) {
  app.use('/auth/asana', authAsanaRouter)
  app.use('/auth/local', authLocalRouter)

  app.use('/api/healthcheck', healthcheckRouter)
  app.use('/api/webhook', webhookRouter)
  app.use('/api/users', usersRouter)
  app.use('/api/projects', projectsRouter)
}

export default routes
