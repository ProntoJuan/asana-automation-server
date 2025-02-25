export const containsUrgentKeyword = (urgentKeywords, notes) => {
  return urgentKeywords
    .some(
      keyword => notes
        .toLowerCase()
        .includes(keyword.toLowerCase())
    )
}
