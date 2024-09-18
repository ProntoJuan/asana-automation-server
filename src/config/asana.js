import Asana from 'asana'

let asanaTaskInstance, asanaStoriesInstance, asanaUsersInstance

const asanaConfig = () => {
  const client = Asana.ApiClient.instance

  const token = client.authentications.token
  token.accessToken = process.env.ASANA_PAT

  asanaTaskInstance = new Asana.TasksApi()
  asanaStoriesInstance = new Asana.StoriesApi()
  asanaUsersInstance = new Asana.UsersApi()
}

const getTask = async (taskId) => {
  try {
    const opts = {}
    const result = await asanaTaskInstance.getTask(taskId, opts)

    return result
  } catch (error) {
    console.error(error.response.body)
  }
}

const updateTask = async (taskId, firstTimeResponse) => {
  const customField = process.env.FRT_CUSTOM_FIELD_ID

  try {
    const body = { data: { custom_fields: { [customField]: firstTimeResponse } } }
    const opts = {}
    const result = await asanaTaskInstance.updateTask(body, taskId, opts)

    return result
  } catch (error) {
    console.error(error.response.body)
  }
}

const getStoriesFromTask = async (taskId) => {
  try {
    const opts = {}
    const results = await asanaStoriesInstance.getStoriesForTask(taskId, opts)

    return results
  } catch (error) {
    console.error(error.response.body)
  }
}

const getUsersInATeam = async (teamId) => {
  try {
    const opts = {}
    const results = await asanaUsersInstance.getUsersForTeam(teamId, opts)

    return results
  } catch (error) {
    console.error(error.response.body)
  }
}

export { asanaConfig, getTask, getStoriesFromTask, getUsersInATeam, updateTask }
