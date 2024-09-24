import express from 'express'

import { asanaConfig } from './config/asana.js'
import configExpress from './config/express.js'
import routes from './routes.js'
import { configJsonDB } from './config/jsonDB.js'

const app = express()
const port = process.env.PORT || 8080

configExpress(app)
routes(app)
asanaConfig()
configJsonDB()

app.listen(port, () => {
  console.log('Server started on port 8080')
})
