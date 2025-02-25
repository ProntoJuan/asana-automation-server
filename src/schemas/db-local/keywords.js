import { randomUUID } from 'crypto'
import DBLocal from 'db-local'

const { Schema } = new DBLocal({ path: './db' })

const Keywords = Schema('Keywords', {
  _id: { type: String, required: true },
  keyword: { type: String, required: true }
})

export class KeywordsRepository {
  static create (data) {
    const id = randomUUID()
    return Keywords.create({ _id: id, keyword: data.toLowerCase() }).save()
  }

  static findAll () {
    return Keywords.find()
  }

  static delete (id) {
    return Keywords.remove({ _id: id })
  }
}
