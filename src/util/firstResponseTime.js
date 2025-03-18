import { DateTime } from 'luxon'

// Helper function to calculate the time difference between two dates
function getTimeDifferenceInHours (startDate, endDate) {
  const end = DateTime.fromISO(endDate)
  const start = DateTime.fromISO(startDate)

  return (end.diff(start).toFormat('s') / 3600).toFixed(2)
}

function calculateFirstResponseTime (taskStories, teamData, taskCreatedAt) {
  const stories = taskStories.data
  const teamIds = new Set(teamData.data.map(member => member.gid))

  const firstResponseStory = stories.find(story => {
    const { type, created_by: createdBy } = story

    if (createdBy === null) return false

    // Check if story is a comment and the user belongs to the team
    return type === 'comment' && teamIds.has(createdBy.gid)
  })

  if (firstResponseStory) {
    const { created_at: storyCreatedAt } = firstResponseStory

    return getTimeDifferenceInHours(taskCreatedAt, storyCreatedAt)
  }

  // If no valid response is found, return an empty string
  console.log('It was not possible to calculate FRT')
  return ''
}

export { calculateFirstResponseTime }
