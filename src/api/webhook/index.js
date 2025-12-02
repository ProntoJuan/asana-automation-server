import { Router } from 'express'
import {
  getWebhooksHandler,
  createWebhookHandler,
  webhookFRTHandler,
  deleteWebhookHandler
} from './webhook.controller.js'
import { authenticateAPI } from '../../middlewares/auth.js'

const router = Router()

router.get('/', getWebhooksHandler)

router.post('/', authenticateAPI, createWebhookHandler)

router.post('/first-response-time/:gid', webhookFRTHandler)

router.delete('/:id', authenticateAPI, deleteWebhookHandler)

export default router
