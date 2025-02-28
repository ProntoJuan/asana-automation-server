import crypto from 'node:crypto'
import DBLocal from 'db-local'
import bcrypt from 'bcrypt'

const saltRounds = Number(process.env.SALT_ROUNDS)

const { Schema } = new DBLocal({ path: './db' })

const User = Schema('User', {
  _id: { type: String, required: true },
  username: { type: String, required: true },
  password: { type: String, required: true }
})

export class UserRepository {
  static async create ({ username, password }) {
    Validation.username(username)
    Validation.password(password)

    const user = User.findOne({ username })
    if (user) throw new Error('username already exists')

    const id = crypto.randomUUID()

    const hashedPassword = await bcrypt.hash(password, saltRounds)

    User.create({
      _id: id,
      username,
      password: hashedPassword
    }).save()

    return id
  }

  static async login ({ username, password }) {
    Validation.username(username)
    Validation.password(password)

    const user = User.findOne({ username })
    if (!user) throw new Error('Username does not exist')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new Error('Password is invalid')

    const { password: _, ...publicUser } = user

    return publicUser
  }
}

class Validation {
  // Los siguientes métodos se usan bajo el patrón de fail-fast, el cual solo busca validar y se lanza un error en vez de retornar algo.

  static username (username) {
    if (typeof username !== 'string') throw new Error('Username must be a string')
    if (username.length < 3) throw new Error('Username must be at least 3 characters long')
  }

  static password (password) {
    if (typeof password !== 'string') throw new Error('Password must be a string')
    if (password.length < 7) throw new Error('Password must be at least 8 characters long')
  }
}
