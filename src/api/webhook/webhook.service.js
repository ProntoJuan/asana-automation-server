import { getStoriesFromTask, getUsersInATeam, updateTask, getTask } from '../../config/asana.js'
import { calculateFirstResponseTime } from '../../util/firstResponseTime.js'

export async function handleFirstResponseTime (storyParentId, createdAt) {
  try {
    const stories = await getStoriesFromTask(storyParentId)
    const team = await getUsersInATeam(process.env.DEDICATED_SUPPORT_GID)

    const firstResponseTime = calculateFirstResponseTime(stories, team, createdAt)

    if (!firstResponseTime) {
      console.log('No FRT')
      return
    }

    const { data } = await updateTask(storyParentId, firstResponseTime)

    console.log(`First Response Time set successfully (${firstResponseTime}) on task "${data.name}" (${data.gid})`)
  } catch (error) {
    console.error('Error calculating the FRT:', error)
  }
}

export async function isLegitStory (storyParentId, data) {
  try {
    if (!storyParentId) {
      console.log({ message: 'No parent. Possibly a comment edit', data })
      return false
    }

    const task = await getTask(storyParentId)
    if (!task) {
      console.error('Task not found')
      return false
    }

    const { custom_fields: customFields, parent, created_at: createdAt } = task.data
    if (parent) {
      console.log("It's a subtask")
      return false
    }

    const isFRT = customFields.find(i => i.gid === process.env.FRT_CUSTOM_FIELD_ID)
    if (!isFRT) {
      console.log('No FRT custom field set. No further actions')
      return false
    }

    if (isFRT.number_value) {
      console.log(`FRT is set: ${isFRT.number_value}. No further actions`)
      return false
    }

    return { createdAt }
  } catch (error) {
    console.error('Error verifing the story:', error)
    return false
  }
}
