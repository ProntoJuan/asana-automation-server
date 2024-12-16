import { getProjectById } from '../../config/asana.js'

const getProjectByIdHandler = async (req, res) => {
  try {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Project ID is required' })
    }

    const project = await getProjectById(id)

    return res.status(200).json({ project })
  } catch (error) {
    console.error(error.response.body)
    res.status(500).json({ message: 'Error getting project' })
  }
}

export { getProjectByIdHandler }
