import Asana from 'asana'

let asanaTaskInstance, asanaStoriesInstance, asanaUsersInstance, asanaProjectsInstance

let asanaToken = null

const asanaConfig = () => {
  const client = Asana.ApiClient.instance

  asanaToken = client.authentications.token

  asanaTaskInstance = new Asana.TasksApi()
  asanaStoriesInstance = new Asana.StoriesApi()
  asanaUsersInstance = new Asana.UsersApi()
  asanaProjectsInstance = new Asana.ProjectsApi()
}

// TASKS

const getTask = async (taskId) => {
  try {
    const opts = {}
    const result = await asanaTaskInstance.getTask(taskId, opts)

    return result
  } catch (error) {
    console.error(error.response.body)
  }
}

const updateTask = async (taskId, customFieldId, value) => {
  try {
    const body = { data: { custom_fields: { [customFieldId]: value } } }
    const opts = {}
    const result = await asanaTaskInstance.updateTask(body, taskId, opts)

    return result
  } catch (error) {
    console.error(error.response.body)
  }
}

// STORIES

const getStoriesFromTask = async (taskId) => {
  try {
    const opts = {}
    const results = await asanaStoriesInstance.getStoriesForTask(taskId, opts)

    return results
  } catch (error) {
    console.error(error.response.body)
  }
}

// USERS

const getUsersInATeam = async (teamId) => {
  try {
    const opts = {}
    const results = await asanaUsersInstance.getUsersForTeam(teamId, opts)

    return results
  } catch (error) {
    console.error(error.response.body)
  }
}

const getUserById = async (userId) => {
  const opts = {}
  const result = await asanaUsersInstance.getUser(userId, opts)

  return result
}

const getMe = async () => {
  const result = await asanaUsersInstance.getUser('me')

  return result
}

// PROJECTS

const getProjectById = async (projectId) => {
  const opts = {}
  const result = await asanaProjectsInstance.getProject(projectId, opts)

  return result
}

export {
  asanaConfig,
  getTask,
  getStoriesFromTask,
  getUsersInATeam,
  updateTask,
  asanaToken,
  getMe,
  getUserById,
  getProjectById
}
