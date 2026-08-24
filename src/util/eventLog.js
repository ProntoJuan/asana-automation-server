import fs from 'fs'
import path from 'path'

// Append-only NDJSON alongside the db-local JSON files. `db/*` is gitignored and
// `/app/db` is the Sevalla persistent disk, so this survives redeploys.
const LOG_DIR = './db'
const LOG_FILE = path.join(LOG_DIR, 'events.ndjson')
const TMP_FILE = `${LOG_FILE}.tmp`

export const RETENTION_DAYS = 7
const MAX_LINES = 5000 // backstop against a burst filling the disk before the daily prune
const PRUNE_INTERVAL_MS = 60 * 60 * 1000

export const LEVELS = ['info', 'warn', 'error']

/**
 * Record something an automation did. Fire-and-forget by design: it is never
 * awaited and never throws, so a disk problem costs a log line rather than an
 * FRT write. `detail` must already be redacted — pass describeAsanaError(err),
 * never a raw Asana/superagent error.
 */
export function logEvent ({ level = 'info', event, projectGid = null, projectName = null, taskGid = null, message = '', detail = null }) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      event,
      projectGid,
      projectName,
      taskGid,
      message,
      detail
    })

    fs.mkdirSync(LOG_DIR, { recursive: true })
    fs.appendFile(LOG_FILE, `${line}\n`, () => {})
  } catch (error) {
    console.error('Failed to write event log entry:', error.message)
  }
}

function readLines () {
  try {
    return fs.readFileSync(LOG_FILE, 'utf8').split('\n').filter(Boolean)
  } catch {
    return [] // no log file yet
  }
}

function parseLine (line) {
  try {
    return JSON.parse(line)
  } catch {
    return null // a torn final line from a crashed append — skip it
  }
}

export function readEvents ({ limit = 200, projectGid = null, level = null } = {}) {
  const entries = readLines().map(parseLine).filter(Boolean)

  const filtered = entries.filter(entry => {
    if (projectGid && entry.projectGid !== projectGid) return false
    if (level && entry.level !== level) return false
    return true
  })

  return filtered.reverse().slice(0, limit)
}

let pruning = false

/**
 * Drop entries older than RETENTION_DAYS, then hard-cap the line count.
 * Writes to a temp file and renames so a concurrent read never sees a torn file.
 */
export function pruneEvents () {
  if (pruning) return
  pruning = true

  try {
    const lines = readLines()
    if (!lines.length) return

    const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000
    const kept = lines.filter(line => {
      const entry = parseLine(line)
      if (!entry) return false
      return new Date(entry.ts).getTime() >= cutoff
    }).slice(-MAX_LINES)

    if (kept.length === lines.length) return

    fs.writeFileSync(TMP_FILE, kept.length ? `${kept.join('\n')}\n` : '')
    fs.renameSync(TMP_FILE, LOG_FILE)
    console.log(`Event log pruned: ${lines.length - kept.length} entr(ies) older than ${RETENTION_DAYS} days removed`)
  } catch (error) {
    console.error('Failed to prune event log:', error.message)
  } finally {
    pruning = false
  }
}

export function startEventLogPruning () {
  pruneEvents()
  const timer = setInterval(pruneEvents, PRUNE_INTERVAL_MS)
  timer.unref() // never hold the process open
  return timer
}
