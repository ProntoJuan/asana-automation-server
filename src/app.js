import express from 'express'
import configExpress from './config/express.js'

const app = express()
const port = process.env.PORT || 8080

configExpress(app)

app.listen(port, () => {
  console.log('Server started on port 8080')
})
