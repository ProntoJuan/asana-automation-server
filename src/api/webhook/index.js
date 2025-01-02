import { Router } from 'express'
import { webhookFTRHandler, webhookTICHandler, createWebhookHandler } from './webhook.controller.js'

const router = Router()

router.post('/', createWebhookHandler)

router.post('/first-response-time/:gid', webhookFTRHandler)

router.post('/total-interaction-count/:gid', webhookTICHandler)

export default router
