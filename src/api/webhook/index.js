import { Router } from 'express'
import {
  getWebhooksHandler,
  createWebhookHandler,
  webhookFTRHandler,
  webhookTICHandler,
  keywordsHandler,
  webhookURHandler,
  deleteWebhookHandler
} from './webhook.controller.js'
import { authenticateAPI } from '../../middlewares/auth.js'

const router = Router()

router.get('/', getWebhooksHandler)

router.post('/', authenticateAPI, createWebhookHandler)

router.post('/first-response-time/:gid', webhookFTRHandler)

router.post('/total-interaction-count/:gid', webhookTICHandler)

router.get('/urgent-request', keywordsHandler)

router.post('/urgent-request/:gid', webhookURHandler)

router.delete('/:id', authenticateAPI, deleteWebhookHandler)

export default router
