import { getWebhooks } from '../config/asana.js'
import { WebhookRepository } from '../schemas/db-local/webhooks.js'
import { formatAsanaError } from './asanaError.js'
import { logEvent } from './eventLog.js'

export async function syncWebhooksFromAsana () {
  try {
    const { data: asanaWebhooks } = await getWebhooks()
    const recovered = []

    for (const webhook of asanaWebhooks) {
      // Target URL format: <host>/api/webhook/<path-segment>/<resource-gid>
      const urlPath = new URL(webhook.target).pathname
      const pathSegment = urlPath.split('/')[3]
      const path = `/${pathSegment}`

      const existing = WebhookRepository.findByGidAndPath(webhook.resource.gid, path)
      if (!existing) {
        const uuid = WebhookRepository.create({ path, resourceId: webhook.resource.gid })
        WebhookRepository.update(uuid, {
          webhookId: webhook.gid,
          resourceType: webhook.resource.resource_type
        })
        recovered.push(webhook.resource.gid)
      }
    }

    if (recovered.length > 0) {
      // Recovered records have NO handshake secret — Asana sends it once, at
      // creation. Events for these fail signature verification with a 401 until
      // the project is deleted and registered again, so say so loudly rather
      // than reporting a successful recovery.
      console.warn(
        `Recovered ${recovered.length} webhook(s) from Asana WITHOUT handshake secrets — ` +
        `signature verification will fail for these until they are re-registered: ${recovered.join(', ')}`
      )

      for (const projectGid of recovered) {
        logEvent({
          level: 'warn',
          event: 'webhook.recovered_without_secret',
          projectGid,
          message: 'Webhook record rebuilt from Asana on startup but has no handshake secret — events will be rejected with 401 until this project is re-registered'
        })
      }
    }
  } catch (error) {
    console.error('Failed to sync webhooks from Asana on startup:', formatAsanaError(error))
  }
}
