import path from 'path'
import { fileURLToPath } from 'url'
import express from 'express'
import morgan from 'morgan'
import session from 'express-session'
import passport from './passport.js'
import routes from '../routes.js'
import { asanaConfig } from './asana.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function configExpress (app) {
  app.set('trust proxy', 1)
  app.use(morgan('dev'))
  app.use(express.json())
  app.use(express.static(path.join(__dirname, '../../public')))

  app.use(session({
    secret: process.env.SECRET_SESSION,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.ENV === 'prod',
      maxAge: 8 * 60 * 60 * 1000
    }
  }))

  app.use(passport.initialize())
  app.use(passport.session())

  asanaConfig()
  routes(app)
}

export default configExpress
