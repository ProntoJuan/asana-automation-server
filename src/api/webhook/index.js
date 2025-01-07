import { Router } from 'express'
import {
  webhookFTRHandler,
  webhookTICHandler,
  createWebhookHandler,
  getWebhooksHandler
} from './webhook.controller.js'
import { checkAuthenticated } from '../../middlewares/auth.js'

const router = Router()

router.get('/', checkAuthenticated, getWebhooksHandler)

router.post('/', checkAuthenticated, createWebhookHandler)

router.post('/first-response-time/:gid', checkAuthenticated, webhookFTRHandler)

router.post('/total-interaction-count/:gid', checkAuthenticated, webhookTICHandler)

export default router
