import express from 'express'
import morgan from 'morgan'
import routes from '../routes.js'
import { asanaConfig } from './asana.js'
import { configJsonDB } from './jsonDB.js'
import { passportConfig } from './passport.js'

function configExpress (app) {
  app.use(morgan('dev'))
  app.use(express.json())
  configJsonDB()

  passportConfig(app)

  asanaConfig()

  routes(app)
}

export default configExpress
