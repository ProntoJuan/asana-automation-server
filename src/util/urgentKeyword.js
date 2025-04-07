export const containsUrgentKeyword = (urgentKeywords, notes) => {
  const excludedPatterns = [
    /\bnot urgent\b/i
  ]
  const isExcluded = excludedPatterns.some((pattern) => pattern.test(notes))

  if (isExcluded) {
    return false
  }

  return urgentKeywords.some((keyword) => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    return regex.test(notes)
  })
}
