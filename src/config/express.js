import express from 'express'
import morgan from 'morgan'
import routes from '../routes.js'
import { asanaConfig } from './asana.js'
import { passportConfig } from './passport.js'
import cors from 'cors'
import cookieParser from 'cookie-parser'

function configExpress (app) {
  app.use(morgan('dev'))
  app.use(cors({
    origin: (origin, callback) => {
      const ACCEPTED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:5173'
      ]

      if (ACCEPTED_ORIGINS.includes(origin)) {
        return callback(null, true)
      }

      if (!origin) {
        return callback(null, true)
      }

      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  }))

  app.use(express.json())
  app.use(cookieParser())

  passportConfig(app)
  asanaConfig()
  routes(app)
}

export default configExpress
