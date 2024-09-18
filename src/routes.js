import healthcheckRouter from './api/healthcheck/index.js'
import webhookRouter from './api/webhook/index.js'

function routes (app) {
  app.use('/healthcheck', healthcheckRouter)
  app.use('/webhook', webhookRouter)
}

export default routes
