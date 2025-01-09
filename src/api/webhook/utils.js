export const buildFinalResponse = (serverResponse, DB) => {
  const finalResponse = serverResponse.map(serverItem => {
    const dbItem = DB.find(dbItem => dbItem.webhookId === serverItem.gid)
    if (dbItem) {
      return {
        _id: dbItem._id,
        webhookId: serverItem.gid,
        resourceId: serverItem.resource.gid,
        path: dbItem.path,
        resourceName: serverItem.resource.name,
        active: serverItem.active,
        createdAt: dbItem.createdAt
      }
    }
    return null
  }).filter(item => item !== null)

  return finalResponse
}
