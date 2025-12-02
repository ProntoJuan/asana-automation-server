import express from 'express'
import morgan from 'morgan'
import routes from '../routes.js'
import { asanaConfig } from './asana.js'

function configExpress (app) {
  app.use(morgan('dev'))

  app.use(express.json())

  asanaConfig()
  routes(app)
}

export default configExpress
