export const containsUrgentKeyword = (urgentKeywords, notes) => {
  return urgentKeywords.some((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(notes)
  })
}
