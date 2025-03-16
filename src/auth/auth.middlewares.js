import jwt from 'jsonwebtoken'

const jwtSecret = process.env.JWT_SECRET

export function isAuthenticated (req, res, next) {
  console.log('On the middleware')
  const token = req.cookies.access_token

  if (!token) return res.status(401).json({ message: 'Not authorize' })
  req.session = { user: null }

  try {
    const data = jwt.verify(token, jwtSecret)
    req.session.user = data
    console.log('On try statement', data)

    next()
  } catch (error) {
    res.status(401).send(error.message)
  }
}
