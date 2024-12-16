import { getMe, getUserById } from '../../config/asana.js'

const meHandler = async (req, res) => {
  try {
    const user = await getMe()

    return res.status(200).json({ user })
  } catch (error) {
    console.error(error.response.body)
    res.status(500).json({ message: 'Error getting user' })
  }
}

const getUserByIdHandler = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    const user = await getUserById(id)

    return res.status(200).json({ user })
  } catch (error) {
    console.error(error.response.body)
    res.status(500).json({ message: 'Error getting user' })
  }
}

export { meHandler, getUserByIdHandler }
