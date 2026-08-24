// Asana errors arrive as superagent errors whose `.response.request` carries the
// Authorization header. Logging the raw object writes the PAT into the runtime
// logs in plaintext, so nothing outside this module should ever touch it —
// everywhere else logs the small, redacted shape returned here.
export function describeAsanaError (error) {
  const first = error?.response?.body?.errors?.[0]

  return {
    status: error?.status ?? null,
    code: first?.error ?? null, // e.g. 'custom_fields_restricted'
    message: first?.message ?? error?.message ?? 'Unknown error'
  }
}

// One-line form for console output.
export function formatAsanaError (error) {
  const { status, code, message } = describeAsanaError(error)
  return [status && `HTTP ${status}`, code, message].filter(Boolean).join(' — ')
}
