import healthcheckRouter from './api/healthcheck/index.js'
import webhookRouter from './api/webhook/index.js'

function routes (app) {
  app.use('/api/healthcheck', healthcheckRouter)
  app.use('/api/webhook', webhookRouter)
}

export default routes
