import { DateTime } from 'luxon'

// Helper function to calculate the time difference between two dates
function getDiffBetweenTwoDates (startDate, endDate) {
  const date1 = DateTime.fromISO(endDate)
  const date2 = DateTime.fromISO(startDate)

  const diff = (date1.diff(date2).toFormat('s') / 3600).toFixed(2)

  return diff
}

function calculateFirstResponseTime (taskStories, teamData, taskCreatedAt) {
  const res = {
    firstResponseTime: '',
    message: ''
  }
  const stories = taskStories.data
  const team = teamData.data.map((e) => e.gid)

  for (const story of stories) {
    const type = story.type
    const userGid = story.created_by?.gid || ''
    const userName = story.created_by?.name || ''
    const storyTime = story.created_at
    const storyGID = story.gid

    // Skip if the type is not a comment
    if (type !== 'comment') {
      res.message = `No valid type: ${type}`
      continue
    }

    // Skip if the user is not part of the team
    if (!team.includes(userGid)) {
      res.message = `No valid user: ${userName} - ${userGid}`
      continue
    }

    // Set the response time and break the loop
    res.message = `First Response Time set. User: ${userName} Story GID: ${storyGID}`
    res.firstResponseTime = getDiffBetweenTwoDates(taskCreatedAt, storyTime)
    break
  }

  return res
}

export { calculateFirstResponseTime }
