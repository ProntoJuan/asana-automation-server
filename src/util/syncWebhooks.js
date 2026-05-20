import { getWebhooks } from '../config/asana.js'
import { WebhookRepository } from '../schemas/db-local/webhooks.js'

export async function syncWebhooksFromAsana () {
  try {
    const { data: asanaWebhooks } = await getWebhooks()
    let synced = 0

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
        synced++
      }
    }

    if (synced > 0) {
      console.log(`Recovered ${synced} webhook(s) from Asana into local DB`)
    }
  } catch (error) {
    console.error('Failed to sync webhooks from Asana on startup:', error.message)
  }
}
