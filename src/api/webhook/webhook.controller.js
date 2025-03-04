import { WebhookRepository } from '../../schemas/db-local/webhooks.js'
import { KeywordsRepository } from '../../schemas/db-local/keywords.js'
import { verifySignature } from '../../util/crypto.js'
import { handleFirstResponseTime, verifyStoryFRT, handleTotalInteractionCount, verifyTaskTIC } from './webhook.service.js'
import { getWebhooks, createFRTWebhook, createTICWebhook, createURWebhook, deleteWebhook, getTask, getStory, updateTask } from '../../config/asana.js'
import { buildFinalResponse } from './utils.js'
import { containsUrgentKeyword } from '../../util/urgentKeyword.js'

export async function getWebhooksHandler (req, res) {
  try {
    const dbData = WebhookRepository.findAll()

    const { data: asanaData } = await getWebhooks()

    console.log(asanaData)

    const webhooks = buildFinalResponse(asanaData, dbData)

    res.status(200).json({ webhooks })
  } catch (error) {
    console.error('Error getting webhooks:', error)
    res.sendStatus(500)
  }
}

export async function createWebhookHandler (req, res) {
  const { path, gid: resourceId } = req.body

  let response

  try {
    switch (path) {
      case '/first-response-time':
        response = await createFRTWebhook(resourceId)
        break
      case '/total-interaction-count':
        response = await createTICWebhook(resourceId)
        break
      case '/urgent-request':
        response = await createURWebhook(resourceId)
        break
      default:
        res.status(400).json({ message: 'Invalid path' })
        return
    }

    console.log('New Webhook created: ', response)

    res.status(201).json({ message: 'Webhook created' })
  } catch (error) {
    console.error('Error creating webhook:', error)
    res.sendStatus(500)
  } finally {
    response = ''
  }
}

export async function webhookFTRHandler (req, res) {
  try {
    const { body } = req
    const { gid } = req.params
    const xHookSignature = req.headers['x-hook-signature']
    const webhook = WebhookRepository.findByGidAndPath(
      gid,
      '/first-response-time'
    )

    // Handle webhook secret handshake when creating a webhook
    if (req.headers['x-hook-secret']) {
      const secret = req.headers['x-hook-secret']

      WebhookRepository.create({
        webhookId: '',
        resourceId: gid,
        resourceType: 'project',
        secret,
        path: '/first-response-time'
      })

      console.log('This is a new webhook')

      res.setHeader('X-Hook-Secret', secret)
      res.sendStatus(200)
      return
    }

    console.log('New event received:', JSON.stringify(body, null, 2))

    const { events } = body
    const storyParentId = events[0]?.parent?.gid || null
    const secretFRT = WebhookRepository.findById(webhook._id).secret

    // Verify the signature of the webhook when an event is sent

    if (!verifySignature(xHookSignature, body, secretFRT)) {
      console.log('Authorization error. Sent 401')
      res.sendStatus(401)
      return
    }
    res.sendStatus(200)

    if (!storyParentId) return

    // Verify info.

    const { createdAt = null } = await verifyStoryFRT(storyParentId, events)

    if (!createdAt) return

    await handleFirstResponseTime(storyParentId, createdAt)
  } catch (error) {
    console.error('Error in webhookHandler:', error)
  }
}

export async function webhookTICHandler (req, res) {
  try {
    const { body } = req
    const { gid } = req.params
    const xHookSignature = req.headers['x-hook-signature']
    const webhook = WebhookRepository.findByGidAndPath(
      gid,
      '/total-interaction-count'
    )

    // Handle webhook secret handshake when creating a webhook
    if (req.headers['x-hook-secret']) {
      const secret = req.headers['x-hook-secret']

      WebhookRepository.create({
        webhookId: '',
        resourceId: gid,
        resourceType: 'project',
        secret,
        path: '/total-interaction-count'
      })

      console.log('This is a new webhook')

      res.setHeader('X-Hook-Secret', secret)
      res.sendStatus(200)
      return
    }

    console.log('New event received:', JSON.stringify(body, null, 2))

    const { events } = body
    const taskId = events[0]?.resource?.gid || null
    const secretTIC = WebhookRepository.findById(webhook._id).secret

    // Verify the signature of the webhook when an event is sent

    if (!verifySignature(xHookSignature, body, secretTIC)) {
      console.log('Authorization error. Sent 401')
      res.sendStatus(401)
      return
    }
    res.sendStatus(200)

    // Verify info
    if (!taskId) return

    const { stories = null, totalInteractionCountId } = await verifyTaskTIC(taskId)

    if (!stories) return

    handleTotalInteractionCount(taskId, stories, totalInteractionCountId)
  } catch (error) {
    console.error('Error in webhookHandler:', error)
  }
}

export function keywordsHandler (req, res) {
  try {
    const keywords = KeywordsRepository.findAll().map(i => i.keyword)

    res.status(200).json({ keywords })
  } catch (error) {
    console.error('Error getting the keywords: ', error.message)
    res.sendStatus(500)
  }
}

export async function webhookURHandler (req, res) {
  try {
    const { body } = req
    const { gid } = req.params
    const xHookSignature = req.headers['x-hook-signature']
    const webhook = WebhookRepository.findByGidAndPath(
      gid,
      '/urgent-request'
    )

    // Handle webhook secret handshake when creating a webhook
    if (req.headers['x-hook-secret']) {
      const secret = req.headers['x-hook-secret']

      WebhookRepository.create({
        webhookId: '',
        resourceId: gid,
        resourceType: 'project',
        secret,
        path: '/urgent-request'
      })

      console.log('This is a new webhook')

      res.setHeader('X-Hook-Secret', secret)
      res.sendStatus(200)
      return
    }

    console.log('New event(s) received:', JSON.stringify(body, null, 2))

    const { events } = body

    const secretUR = WebhookRepository.findById(webhook._id).secret

    // Verify the signature of the webhook when an event is sent

    if (!verifySignature(xHookSignature, body, secretUR)) {
      console.log('Authorization error. Sent 401')
      res.sendStatus(401)
      return
    }
    res.sendStatus(200)

    if (events.length === 0) return

    let textToAnalyze = ''
    let taskId = null

    for (const event of events) {
      if (event.action === 'changed') {
        // When a task change on title or description
        if (
          event.resource.resource_type === 'task' &&
          (
            event.change.field === 'name' ||
            event.change.field === 'notes' ||
            event.change.field === 'html_notes'
          )
        ) {
          taskId = event.resource.gid
          const { name, notes } = (await getTask(event.resource.gid)).data
          textToAnalyze += name + notes
        }
        // When a story change
        if (
          event.resource.resource_type === 'story' &&
          event.change.field === 'text'
        ) {
          const {
            text,
            target: { gid: taskGid }
          } = (await getStory(event.resource.gid)).data
          taskId = taskGid
          textToAnalyze += text
        }
      }

      if (event.action === 'added') {
        // When a new task is added
        if (
          event.resource.resource_type === 'task' &&
          event.parent.resource_type === 'project'
        ) {
          taskId = event.resource.gid
          const { name, notes } = (await getTask(event.resource.gid)).data
          textToAnalyze += name + notes
        }
        // When a new comment is added
        if (
          event.resource.resource_subtype === 'comment_added' &&
          event.user !== null
        ) {
          taskId = event.parent.gid
          const { text } = (await getStory(event.resource.gid)).data
          textToAnalyze += text
        }
      }
    }

    if (!textToAnalyze) return

    const urgentKeywords = KeywordsRepository.findAll().map(i => i.keyword)

    const isUrgentWordDetected = containsUrgentKeyword(urgentKeywords, textToAnalyze)

    if (!isUrgentWordDetected) return

    await updateTask(
      taskId,
      process.env.PRIORITY_CUSTOM_FIELD_GID,
      process.env.URGENT_ENUM_PRIORITY_GID
    )

    console.log(`New keyword detected on task ${taskId}`)
  } catch (error) {
    console.error('Error in webhookHandler:', error)
  }
}

export async function deleteWebhookHandler (req, res) {
  try {
    const { id } = req.params

    await deleteWebhook(id)

    WebhookRepository.delete({ webhookId: id })

    res.status(200).json({ message: 'Webhook deleted' })
  } catch (error) {
    console.error('Error in webhookHandler:', error)
    res.sendStatus(500)
  }
}
