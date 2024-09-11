import express from 'express'

import { asanaConfig } from './config/asana.js';
import configExpress from './config/express.js';
import routes from './routes.js'

const app = express();
const port = process.env.PORT || 8080;

configExpress(app)
routes(app)
asanaConfig()

app.listen(port, () => {
  console.log(`Server started on port 8080`);
});