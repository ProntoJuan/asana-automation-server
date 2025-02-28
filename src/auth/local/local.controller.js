import jwt from 'jsonwebtoken'
import { UserRepository } from '../../schemas/db-local/users.js'

const jwtSecret = process.env.JWT_SECRET

export async function loginLocalHandler (req, res) {
  const { username, password } = req.body

  try {
    const user = await UserRepository.login({ username, password })
    const token = jwt.sign(
      { id: user._id, username: user.username },
      jwtSecret,
      { expiresIn: '7d' }
    )
    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.ENV === 'prod',
        sameSite: 'strict',
        maxAge: 7 * 24 * 3600 * 1000
      })
      .send({ user, token })
  } catch (error) {
    res.status(401).send(error.message)
  }
}

export async function registerLocalHandler (req, res) {
  const { username, password } = req.body

  try {
    const id = await UserRepository.create({ username, password })
    res.send({ id })
  } catch (error) {
    res.status(400).send(error.message)
  }
}

export function protectedHandler (req, res) {
  try {
    const { user } = req.session

    if (!user) return res.status(401).json({ message: 'Not authorized' })

    console.log('end')
    res.status(200).send('Hellow')
  } catch (error) {
    res.status(401).send(error.message)
  }
}
