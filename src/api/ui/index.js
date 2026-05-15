import { Router } from 'express'
import { getMeUI, getWebhooksUI, getProjectsUI, registerWebhookUI, deleteWebhookUI } from './ui.controller.js'

const router = Router()

router.get('/me', getMeUI)
router.get('/webhooks', getWebhooksUI)
router.get('/projects', getProjectsUI)
router.post('/webhooks', registerWebhookUI)
router.delete('/webhooks/:id', deleteWebhookUI)

export default router
