import { verifySignature } from '../../util/crypto.js'
import { handleFirstResponseTime, isLegitStory } from './webhook.service.js'

let secret = process.env.WEBHOOK_SECRET

export async function webhookHandler (req, res) {
  try {
    const { body } = req
    const xHookSignature = req.headers['x-hook-signature']

    // Handle webhook secret handshake when creating a webhook
    if (req.headers['x-hook-secret']) {
      secret = req.headers['x-hook-secret']

      console.log('This is a new webhook')

      res.setHeader('X-Hook-Secret', secret)
      res.sendStatus(200)
      return
    }

    console.log('New event received:', body)

    // Verify the signature of the webhook when an event is sent
    if (!verifySignature(xHookSignature, body, secret)) {
      console.log('Authorization errror. Sent 401')
      res.sendStatus(401)
      return
    }

    // Verify if the event has info.
    const data = req.body.events
    if (!data[0]) {
      console.log('No data')
      return res.sendStatus(200)
    }

    const { gid: storyParentId = null } = data[0]?.parent || {}

    // Verify if is a legit story.
    const isLegit = await isLegitStory(storyParentId, data)
    const { createdAt } = isLegit

    if (!isLegit) {
      return res.sendStatus(200)
    }

    await handleFirstResponseTime(storyParentId, createdAt)
    res.sendStatus(200)
  } catch (error) {
    console.error('Error in webhookHandler:', error)
    res.sendStatus(500)
  }
}
