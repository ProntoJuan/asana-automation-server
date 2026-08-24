import { getStoriesFromTask, getUsersInATeam, updateTask, getTask } from '../../config/asana.js'
import { calculateFirstResponseTime } from '../../util/firstResponseTime.js'
import { describeAsanaError, formatAsanaError } from '../../util/asanaError.js'
import { logEvent } from '../../util/eventLog.js'

export async function handleFirstResponseTime (storyParentId, createdAt, projectGid = null) {
  try {
    const stories = await getStoriesFromTask(storyParentId)
    const team = await getUsersInATeam(process.env.DEDICATED_SUPPORT_GID)

    const firstResponseTime = calculateFirstResponseTime(stories, team, createdAt)

    if (!firstResponseTime) {
      console.log('No FRT')
      logEvent({
        event: 'frt.no_response_yet',
        projectGid,
        taskGid: storyParentId,
        message: 'No comment from a Dedicated Support member yet — nothing to record'
      })
      return
    }

    const customFieldId = process.env.FRT_CUSTOM_FIELD_ID

    const { data } = await updateTask(storyParentId, customFieldId, firstResponseTime)

    console.log(`First Response Time set successfully (${firstResponseTime}) on task "${data.name}" (${data.gid})`)
    logEvent({
      event: 'frt.written',
      projectGid,
      taskGid: storyParentId,
      message: `FRT set to ${firstResponseTime}h on "${data.name}"`,
      detail: { hours: firstResponseTime, taskName: data.name }
    })
  } catch (error) {
    // Never log `error` itself — it carries the Authorization header.
    const detail = describeAsanaError(error)
    console.error('Error calculating FRT:', formatAsanaError(error))
    logEvent({
      level: 'error',
      event: 'frt.failed',
      projectGid,
      taskGid: storyParentId,
      message: detail.code === 'custom_fields_restricted'
        ? 'Asana refused the write: the server account lacks Editor access to the FRT field on this project'
        : `Could not write FRT: ${detail.message}`,
      detail
    })
  }
}

export async function verifyStoryFRT (storyParentId, projectGid = null) {
  const skip = (reason, message) => {
    console.log(message)
    logEvent({ event: 'frt.skipped', projectGid, taskGid: storyParentId, message, detail: { reason } })
    return false
  }

  try {
    const task = await getTask(storyParentId)
    if (!task) return skip('task-not-found', 'Task not found')

    const { custom_fields: customFields, created_at: createdAt, parent } = task.data

    if (parent) return skip('subtask', "It's a subtask")

    const isFRT = customFields.find(i => i.gid === process.env.FRT_CUSTOM_FIELD_ID)
    if (!isFRT) return skip('no-frt-field', 'No FRT custom field set. No further actions')

    if (isFRT.number_value) {
      return skip('already-set', `FRT is set: ${isFRT.number_value}. No further actions`)
    }

    return { createdAt }
  } catch (error) {
    const detail = describeAsanaError(error)
    console.error('Error verifying the story:', formatAsanaError(error))
    logEvent({
      level: 'error',
      event: 'frt.failed',
      projectGid,
      taskGid: storyParentId,
      message: `Could not read the task: ${detail.message}`,
      detail
    })
    return false
  }
}
