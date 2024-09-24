import { Router } from 'express'
import { webhookFTRHandler, webhookTICHandler } from './webhook.controller.js'

const router = Router()

// /webhook/first-time-response -> Receive story events
router.post('/first-time-response', webhookFTRHandler)

// /webhook/total-interaction-count ->
router.post('/total-interaction-count', webhookTICHandler)

export default router
