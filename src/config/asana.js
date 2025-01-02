import Asana from 'asana'

let asanaTaskInstance, asanaStoriesInstance, asanaUsersInstance, asanaProjectsInstance, asanaWebhooksInstance

const asanaConfig = () => {
  const client = Asana.ApiClient.instance
  const token = client.authentications.token

  token.accessToken = process.env.ASANA_PAT

  asanaWebhooksInstance = new Asana.WebhooksApi()
  asanaTaskInstance = new Asana.TasksApi()
  asanaStoriesInstance = new Asana.StoriesApi()
  asanaUsersInstance = new Asana.UsersApi()
  asanaProjectsInstance = new Asana.ProjectsApi()
}

// WEBHOOKS

const createFRTWebhook = async (resource) => {
  const body = {
    data: {
      resource,
      target: `https://9ee9-2800-e2-1d80-1e9-db02-b39-bbdf-1b07.ngrok-free.app/api/webhook/first-response-time/${resource}`,
      filters: [
        {
          resource_type: 'story',
          action: 'added',
          resource_subtype: 'comment_added'
        }
      ]
    }
  }
  const opts = {}
  const result = await asanaWebhooksInstance.createWebhook(body, opts)

  return result
}

const createTICWebhook = async (resource) => {
  const body = {
    data: {
      resource,
      target: `https://9ee9-2800-e2-1d80-1e9-db02-b39-bbdf-1b07.ngrok-free.app/api/webhook/total-interaction-count/${resource}`,
      filters: [
        {
          resource_type: 'task',
          action: 'changed',
          resource_subtype: 'default_task',
          fields: ['completed']
        }
      ]
    }
  }
  const opts = {}
  const result = await asanaWebhooksInstance.createWebhook(body, opts)

  return result
}

// TASKS

const getTask = async (taskId) => {
  const opts = {}
  const result = await asanaTaskInstance.getTask(taskId, opts)

  return result
}

const updateTask = async (taskId, customFieldId, value) => {
  const body = { data: { custom_fields: { [customFieldId]: value } } }
  const opts = {}
  const result = await asanaTaskInstance.updateTask(body, taskId, opts)

  return result
}

// STORIES

const getStoriesFromTask = async (taskId) => {
  const opts = {}
  const results = await asanaStoriesInstance.getStoriesForTask(taskId, opts)

  return results
}

// USERS

const getUsersInATeam = async (teamId) => {
  const opts = {}
  const results = await asanaUsersInstance.getUsersForTeam(teamId, opts)

  return results
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
  createFRTWebhook,
  createTICWebhook,
  getTask,
  getStoriesFromTask,
  getUsersInATeam,
  updateTask,
  getMe,
  getUserById,
  getProjectById
}
