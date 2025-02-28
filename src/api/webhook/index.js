import { Router } from 'express'
import {
  getWebhooksHandler,
  createWebhookHandler,
  webhookFTRHandler,
  webhookTICHandler,
  webhookURHandler,
  deleteWebhookHandler
} from './webhook.controller.js'
import { checkAuthenticated } from '../../middlewares/auth.js'

const router = Router()

router.get('/', getWebhooksHandler)

router.post('/', checkAuthenticated, createWebhookHandler)

router.post('/first-response-time/:gid', webhookFTRHandler)

router.post('/total-interaction-count/:gid', webhookTICHandler)

router.post('/urgent-request/:gid', webhookURHandler)

router.delete('/:id', checkAuthenticated, deleteWebhookHandler)

export default router
