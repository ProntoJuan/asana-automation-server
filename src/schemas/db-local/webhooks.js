import { randomUUID } from 'crypto'
import DBLocal from 'db-local'

const { Schema } = new DBLocal({ path: './db' })

const Webhook = Schema('Webhook', {
  _id: { type: String, required: true },
  webhookId: { type: String, required: false },
  resourceId: { type: String, required: true },
  resourceType: { type: String, required: false },
  secret: { type: String, required: false },
  path: { type: String, required: true },
  createdAt: { type: String, required: true }
})

export class WebhookRepository {
  static create (data) {
    const id = randomUUID()
    const createdAt = new Date().toISOString()

    const entry = Webhook.findOne({ resourceId: data.resourceId, path: data.path })

    if (entry) throw new Error('Webhook already exists')

    Webhook.create({ _id: id, createdAt, ...data }).save()

    return id
  }

  static findAll () {
    return Webhook.find().map((entry) => {
      return {
        _id: entry._id,
        webhookId: entry.webhookId,
        resourceId: entry.resourceId,
        path: entry.path,
        createdAt: entry.createdAt
      }
    })
  }

  static findById (id) {
    return Webhook.findOne({ _id: id })
  }

  static findByGid (gid) {
    return Webhook.findOne({ resourceId: gid })
  }

  static findByGidAndPath (gid, path) {
    return Webhook.findOne({ resourceId: gid, path })
  }

  static findByPath (path) {
    return Webhook.find({ path })
  }

  static update (id, data) {
    const entry = Webhook.findOne({ _id: id })
    return entry.update(data).save()
  }

  static delete (obj) {
    return Webhook.remove(obj)
  }
}
