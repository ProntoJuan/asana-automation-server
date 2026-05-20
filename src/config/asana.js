import Asana from 'asana'

let asanaTaskInstance, asanaStoriesInstance, asanaUsersInstance, asanaProjectsInstance, asanaWebhooksInstance, asanaTeamsInstance

const target = process.env.ENV === 'local' ? process.env.WEBHOOK_TARGET : process.env.HOST

const workspace = process.env.ASANA_WORKSPACE

const asanaConfig = () => {
  const client = Asana.ApiClient.instance
  const token = client.authentications.token

  token.accessToken = process.env.ASANA_PAT

  asanaWebhooksInstance = new Asana.WebhooksApi()
  asanaTaskInstance = new Asana.TasksApi()
  asanaStoriesInstance = new Asana.StoriesApi()
  asanaUsersInstance = new Asana.UsersApi()
  asanaProjectsInstance = new Asana.ProjectsApi()
  asanaTeamsInstance = new Asana.TeamsApi()
}

// WEBHOOKS

const getWebhooks = async () => {
  const opts = {}
  const result = await asanaWebhooksInstance.getWebhooks(workspace, opts)

  return result
}

const createFRTWebhook = async (resource) => {
  const body = {
    data: {
      resource,
      target: `${target}/api/webhook/first-response-time/${resource}`,
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
      target: `${target}/api/webhook/total-interaction-count/${resource}`,
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

const createURWebhook = async (resource) => {
  const body = {
    data: {
      resource,
      target: `${target}/api/webhook/urgent-request/${resource}`
    }
  }
  return asanaWebhooksInstance.createWebhook(body)
}

const deleteWebhook = async (webhookId) => {
  const result = await asanaWebhooksInstance.deleteWebhook(webhookId)

  return result
}
// TASKS

const getTask = async (taskId) => {
  const opts = { opt_fields: 'gid,name,created_at,parent,parent.gid,custom_fields,custom_fields.gid,custom_fields.number_value' }
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

const getStory = async (storyId) => {
  const opts = {}
  const results = await asanaStoriesInstance.getStory(storyId, opts)

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

const getProjectsInWorkspace = async () => {
  const opts = {
    workspace: process.env.ASANA_WORKSPACE,
    opt_fields: 'gid,name',
    archived: false,
    limit: 100
  }
  return asanaProjectsInstance.getProjects(opts)
}

const getUserByEmail = async (email) => {
  const opts = { opt_fields: 'gid,email', limit: 100 }
  const result = await asanaUsersInstance.getUsersForWorkspace(workspace, opts)
  const users = result.data ?? []
  return users.find(u => u.email === email) ?? null
}

const getTeamsForUser = async (userGid) => {
  const opts = { opt_fields: 'gid,name', limit: 100 }
  const result = await asanaTeamsInstance.getTeamsForUser(userGid, workspace, opts)
  return result.data ?? []
}

const getProjectsForTeam = async (teamGid) => {
  const opts = { opt_fields: 'gid,name', archived: false, limit: 100 }
  const result = await asanaProjectsInstance.getProjectsForTeam(teamGid, opts)
  return result.data ?? []
}

export {
  asanaConfig,
  getWebhooks,
  createFRTWebhook,
  createTICWebhook,
  createURWebhook,
  deleteWebhook,
  getTask,
  getStoriesFromTask,
  getStory,
  getUsersInATeam,
  updateTask,
  getMe,
  getUserById,
  getProjectById,
  getProjectsInWorkspace,
  getUserByEmail,
  getTeamsForUser,
  getProjectsForTeam
}
