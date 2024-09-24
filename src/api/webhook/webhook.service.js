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

    const customFieldId = process.env.FRT_CUSTOM_FIELD_ID

    const { data } = await updateTask(storyParentId, customFieldId, firstResponseTime)

    console.log(`First Response Time set successfully (${firstResponseTime}) on task "${data.name}" (${data.gid})`)
  } catch (error) {
    console.error('Error calculating FRT:', error)
  }
}

export async function verifyStoryFRT (storyParentId) {
  try {
    const task = await getTask(storyParentId)
    if (!task) {
      console.log('Task not found')
      return false
    }

    const { custom_fields: customFields, created_at: createdAt, parent } = task.data

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
    console.error('Error verifying the story:', error)
    return false
  }
}

export async function handleTotalInteractionCount (taskId, stories, totalInteractionCountId) {
  try {
    const totalComments = stories.reduce((acc, cur) => {
      if (cur.type === 'comment') return acc + 1

      return acc
    }, 0)

    console.log('Total Interaction Count:', totalComments)

    const { data } = await updateTask(taskId, totalInteractionCountId, totalComments)

    console.log(`Total Interaction Count set successfully (${totalComments}) on task "${data.name}" (${data.gid})`)
  } catch (error) {
    console.error('Error calculating TIC:', error)
  }
}

export async function verifyTaskTIC (taskId) {
  try {
    const { data: { parent, completed, custom_fields: customFields } } = await getTask(taskId)

    if (parent) {
      console.log("It's a subtask")
      return
    }

    const totalInteractionCountId = process.env.TIC_CUSTOM_FIELD_ID

    const isTIC = customFields.find(i => i.gid === totalInteractionCountId)

    if (!isTIC) {
      console.log('No TIC custom field set. No further actions')
      return
    }

    if (!completed) {
      console.log('Task not completed')
      await updateTask(taskId, totalInteractionCountId, null)
      return
    }

    const { data } = await getStoriesFromTask(taskId)

    return { stories: data, totalInteractionCountId }
  } catch (error) {
    console.error('Error verifying the task:', error)
    return false
  }
}
