import {
  getAllWebhooks,
  getMe,
  getProjectById,
  getProjectMemberships,
  getCustomFieldSettingsForProject
} from '../config/asana.js'
import { WebhookRepository } from '../schemas/db-local/webhooks.js'
import { describeAsanaError } from '../util/asanaError.js'

// Access levels Asana lets write a custom field. Anything else produces the
// 403 `custom_fields_restricted` that silently killed FRT on Marzano EC.
const WRITE_ACCESS_LEVELS = new Set(['admin', 'editor'])

const WEBHOOK_TYPES = [
  { path: '/first-response-time', label: 'FRT' },
  { path: '/urgent-request', label: 'Urgent Keyword' }
]

const check = (id, label, status, message, fix = null) => ({ id, label, status, message, fix })

let botCache = null

// The PAT owner. Cached for the process — it only changes when ASANA_PAT does,
// which means a redeploy anyway.
export async function getBotIdentity () {
  if (botCache) return botCache

  const { data } = await getMe()
  botCache = { gid: data.gid, name: data.name, email: data.email }

  return botCache
}

function webhookChecks (typeLabel, record, webhookList) {
  const checks = []
  const prefix = typeLabel === 'FRT' ? 'frt' : 'urgent'

  const liveWebhook = webhookList.webhooks.find(w => w.gid === record.webhookId)

  if (!webhookList.complete) {
    // A partial list can't prove absence — say so rather than cry ghost.
    checks.push(check(
      `webhook.${prefix}.live`, `${typeLabel} webhook exists in Asana`, 'unknown',
      'Could not list webhooks from Asana, so this could not be verified.'
    ))
  } else if (!liveWebhook) {
    checks.push(check(
      `webhook.${prefix}.live`, `${typeLabel} webhook exists in Asana`, 'fail',
      `Ghost record: webhook ${record.webhookId} is stored locally but no longer exists in Asana.`,
      'Remove this project from Connected Projects and register it again.'
    ))
  } else {
    checks.push(check(`webhook.${prefix}.live`, `${typeLabel} webhook exists in Asana`, 'pass', 'Found in Asana.'))

    checks.push(liveWebhook.active
      ? check(`webhook.${prefix}.active`, `${typeLabel} webhook is active`, 'pass', 'Asana is delivering events.')
      : check(
        `webhook.${prefix}.active`, `${typeLabel} webhook is active`, 'fail',
        'Asana deactivated this webhook after repeated failed deliveries.',
        'Remove this project from Connected Projects and register it again.'
      ))
  }

  checks.push(record.secret
    ? check(`webhook.${prefix}.secret`, `${typeLabel} handshake secret stored`, 'pass', 'Signatures can be verified.')
    : check(
      `webhook.${prefix}.secret`, `${typeLabel} handshake secret stored`, 'fail',
      'No handshake secret — Asana only sends it once, at creation, so this record was recovered rather than registered. Every incoming event will be rejected with 401.',
      'Remove this project from Connected Projects and register it again.'
    ))

  return checks
}

/**
 * Everything that has to be true for a project's automations to work.
 * Never throws: an Asana call that fails yields an `unknown` check rather than
 * a false failure, because a wrong "all good" is worse than a missing answer.
 *
 * Pass a shared `webhookList` when checking many projects to avoid re-listing.
 */
export async function checkProject (projectGid, { webhookList = null } = {}) {
  const list = webhookList ?? await getAllWebhooks()
  const checks = []

  let bot = null
  try {
    bot = await getBotIdentity()
  } catch (error) {
    checks.push(check(
      'bot.identity', 'Server Asana identity', 'unknown',
      `Could not read the server's own Asana user: ${describeAsanaError(error).message}`
    ))
  }

  // --- Webhook registration health -----------------------------------------
  const registered = []
  for (const { path, label } of WEBHOOK_TYPES) {
    const record = WebhookRepository.findByGidAndPath(projectGid, path)
    if (!record) continue
    registered.push(path)
    checks.push(...webhookChecks(label, record, list))
  }

  if (!registered.length) {
    checks.push(check(
      'webhook.registered', 'Project is registered', 'fail',
      'No webhook is registered for this project.',
      'Register it from the Register Project page.'
    ))
  }

  // --- Project + permissions ------------------------------------------------
  let project = null
  try {
    project = (await getProjectById(projectGid)).data
  } catch (error) {
    checks.push(check(
      'project.readable', 'Project is readable', 'fail',
      `Asana would not return this project: ${describeAsanaError(error).message}`,
      `Confirm the project still exists and that ${bot?.name ?? 'the server account'} can see it.`
    ))
  }

  if (bot && project) {
    try {
      const memberships = await getProjectMemberships(projectGid)
      const membership = memberships.find(m => m.user?.gid === bot.gid)
      const level = membership?.access_level ?? project.default_access_level ?? null

      if (!level) {
        checks.push(check(
          'bot.access', `${bot.name} can edit this project`, 'unknown',
          'Asana did not report an access level for this project.'
        ))
      } else if (WRITE_ACCESS_LEVELS.has(level)) {
        checks.push(check(
          'bot.access', `${bot.name} can edit this project`, 'pass',
          `Access level: ${level}${membership ? '' : ' (project default — not an explicit member)'}.`
        ))
      } else {
        // This is the Marzano EC failure: visible, commentable, not writable.
        checks.push(check(
          'bot.access', `${bot.name} can edit this project`, 'fail',
          `${bot.name} has "${level}" access${membership ? '' : ' (project default — not an explicit member)'}, which cannot write custom fields. Asana rejects the update with 403 custom_fields_restricted.`,
          `In Asana, open this project → Share → set ${bot.email ?? bot.name} to Editor.`
        ))
      }
    } catch (error) {
      checks.push(check(
        'bot.access', `${bot.name} can edit this project`, 'unknown',
        `Could not read project members: ${describeAsanaError(error).message}`
      ))
    }
  }

  // --- Required custom fields ----------------------------------------------
  if (project) {
    try {
      const settings = await getCustomFieldSettingsForProject(projectGid)
      const fieldGids = new Set(settings.map(s => s.custom_field?.gid))

      if (registered.includes('/first-response-time')) {
        checks.push(fieldGids.has(process.env.FRT_CUSTOM_FIELD_ID)
          ? check('field.frt', 'FRT (hours) field is on the project', 'pass', 'Field found.')
          : check(
            'field.frt', 'FRT (hours) field is on the project', 'fail',
            'The "FRT (hours)" custom field is not attached to this project, so there is nothing to write to.',
            'In Asana, add the "FRT (hours)" custom field to this project.'
          ))
      }

      if (registered.includes('/urgent-request')) {
        checks.push(fieldGids.has(process.env.PRIORITY_CUSTOM_FIELD_GID)
          ? check('field.priority', 'Priority field is on the project', 'pass', 'Field found.')
          : check(
            'field.priority', 'Priority field is on the project', 'fail',
            'The Priority custom field is not attached to this project, so urgent keywords cannot set it.',
            'In Asana, add the Priority custom field to this project.'
          ))
      }
    } catch (error) {
      checks.push(check(
        'field.custom_fields', 'Required custom fields are on the project', 'unknown',
        `Could not read the project's custom fields: ${describeAsanaError(error).message}`
      ))
    }
  }

  const failed = checks.filter(c => c.status === 'fail')
  const unknown = checks.filter(c => c.status === 'unknown')

  return {
    projectGid,
    projectName: project?.name ?? null,
    bot,
    status: failed.length ? 'fail' : unknown.length ? 'unknown' : 'pass',
    checks
  }
}
