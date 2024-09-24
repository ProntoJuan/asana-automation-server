import { dbJson } from '../../config/jsonDB.js'
import { verifySignature } from '../../util/crypto.js'
import { handleFirstResponseTime, verifyStoryFRT, handleTotalInteractionCount, verifyTaskTIC } from './webhook.service.js'

export async function webhookFTRHandler (req, res) {
  try {
    const { body } = req
    const xHookSignature = req.headers['x-hook-signature']

    // Handle webhook secret handshake when creating a webhook
    if (req.headers['x-hook-secret']) {
      const secret = req.headers['x-hook-secret']

      await dbJson.push('/secretFRT', secret)

      console.log('This is a new webhook')

      res.setHeader('X-Hook-Secret', secret)
      res.sendStatus(200)
      return
    }

    console.log('New event received:', JSON.stringify(body, null, 2))

    // Verify the signature of the webhook when an event is sent

    const secretFRT = await dbJson.getData('/secretFRT')

    if (!verifySignature(xHookSignature, body, secretFRT)) {
      console.log('Authorization error. Sent 401')
      res.sendStatus(401)
      return
    }
    res.sendStatus(200)

    const { events } = body

    const storyParentId = events[0]?.parent?.gid || null

    // Verify info.
    if (!storyParentId) return console.log('No data on Events')

    const { createdAt = null } = await verifyStoryFRT(storyParentId, events)

    if (!createdAt) return

    await handleFirstResponseTime(storyParentId, createdAt)
  } catch (error) {
    console.error('Error in webhookHandler:', error)
    res.sendStatus(500)
  }
}

export async function webhookTICHandler (req, res) {
  try {
    const { body } = req
    const xHookSignature = req.headers['x-hook-signature']

    // Handle webhook secret handshake when creating a webhook
    if (req.headers['x-hook-secret']) {
      const secret = req.headers['x-hook-secret']

      await dbJson.push('/secretTIC', secret)

      console.log('This is a new webhook')

      res.setHeader('X-Hook-Secret', secret)
      res.sendStatus(200)
      return
    }

    console.log('New event received:', JSON.stringify(body, null, 2))

    // Verify the signature of the webhook when an event is sent

    const secretTIC = await dbJson.getData('/secretTIC')

    if (!verifySignature(xHookSignature, body, secretTIC)) {
      console.log('Authorization error. Sent 401')
      res.sendStatus(401)
      return
    }
    res.sendStatus(200)

    const { events } = body

    const taskId = events[0]?.resource?.gid || null

    // Verify info
    if (!taskId) return console.log('No data on Events')

    const { stories = null, totalInteractionCountId } = await verifyTaskTIC(taskId)

    if (!stories) return

    handleTotalInteractionCount(taskId, stories, totalInteractionCountId)
  } catch (error) {
    console.error('Error in webhookHandler:', error)
    res.sendStatus(500)
  }
}
