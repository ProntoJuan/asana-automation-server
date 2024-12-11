import express from 'express'
import morgan from 'morgan'
import routes from '../routes.js'
import { asanaConfig } from './asana.js'
import { configJsonDB } from './jsonDB.js'

function configExpress (app) {
  routes(app)
  asanaConfig()
  configJsonDB()
  app.use(morgan('dev'))
  app.use(express.json())
}

export default configExpress
