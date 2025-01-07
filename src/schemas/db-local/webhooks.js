import { randomUUID } from 'crypto'
import DBLocal from 'db-local'

const { Schema } = new DBLocal({ path: './db' })

export const Webhook = Schema('Webhook', {
  _id: { type: String, required: true },
  gid: { type: String, required: true },
  secret: { type: String, required: false },
  path: { type: String, required: true },
  createdAt: { type: String, required: true }
})

export class WebhookRepository {
  static create (data) {
    const id = randomUUID()
    const createdAt = new Date().toISOString()

    const entry = Webhook.findOne({ gid: data.gid, path: data.path })

    if (entry) throw new Error('Webhook already exists')

    Webhook.create({ _id: id, createdAt, ...data }).save()

    return id
  }

  static findAll () {
    return Webhook.find().map((entry) => {
      return {
        _id: entry._id,
        gid: entry.gid,
        path: entry.path,
        createdAt: entry.createdAt
      }
    })
  }

  static findById (id) {
    return Webhook.findOne({ _id: id })
  }

  static findByGid (gid) {
    return Webhook.findOne({ gid })
  }

  static findByGidAndPath (gid, path) {
    return Webhook.findOne({ gid, path })
  }

  static findByPath (path) {
    return Webhook.find({ path })
  }

  static findLatest () {
    return Webhook.find().reduce((lat, cur) => {
      return new Date(cur.createdAt) > new Date(lat.createdAt) ? cur : lat
    })
  }

  static update (id, data) {
    const entry = Webhook.findOne({ _id: id })
    return entry.update(data).save()
  }

  static delete (id) {
    Webhook.remove({ _id: id })
    return id
  }
}
