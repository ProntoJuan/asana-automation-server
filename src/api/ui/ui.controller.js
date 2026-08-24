import { getWebhooks, getAllWebhooks, deleteWebhook, createFRTWebhook, createURWebhook, getProjectsInWorkspace, getUserByEmail, getTeamsForUser, getProjectsForTeam, getTeamlessProjectsForUser, getProjectById } from '../../config/asana.js'
import { WebhookRepository } from '../../schemas/db-local/webhooks.js'
import { buildFinalResponse } from '../webhook/utils.js'
import { formatAsanaError } from '../../util/asanaError.js'
import { logEvent, readEvents, RETENTION_DAYS } from '../../util/eventLog.js'
import { checkProject, getBotIdentity } from '../../services/diagnostics.js'

export function getMeUI (req, res) {
  res.json(req.user)
}

export async function getWebhooksUI (req, res) {
  try {
    const dbData = WebhookRepository.findAll()
    const { data: asanaData } = await getWebhooks()
    res.json({ webhooks: buildFinalResponse(asanaData, dbData) })
  } catch (error) {
    console.error('Error getting webhooks:', formatAsanaError(error))
    res.sendStatus(500)
  }
}

export async function getProjectsUI (req, res) {
  try {
    const registered = new Set(WebhookRepository.findAll().map(w => w.resourceId))

    const asanaUser = await getUserByEmail(req.user.email)
    if (!asanaUser) {
      console.warn(`No Asana user found for email: ${req.user.email}`)
      const { data: allProjects } = await getProjectsInWorkspace()
      const available = allProjects
        .filter(p => !registered.has(p.gid))
        .sort((a, b) => a.name.localeCompare(b.name))
      return res.json({ projects: available })
    }

    const teams = await getTeamsForUser(asanaUser.gid)
    const [teamProjectArrays, teamlessProjects] = await Promise.all([
      Promise.all(teams.map(t => getProjectsForTeam(t.gid))),
      getTeamlessProjectsForUser(asanaUser.gid)
    ])

    const seen = new Set()
    const available = [...teamProjectArrays.flat(), ...teamlessProjects]
      .filter(p => {
        if (registered.has(p.gid) || seen.has(p.gid)) return false
        seen.add(p.gid)
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    res.json({ projects: available })
  } catch (error) {
    console.error('Error getting projects:', formatAsanaError(error))
    res.sendStatus(500)
  }
}

export async function lookupProjectUI (req, res) {
  try {
    const { gid } = req.params
    const existing = WebhookRepository.findByGid(gid)

    if (existing) {
      // Don't trust the local record blindly — a "ghost" record whose webhook is
      // gone from Asana permanently blocks re-registration. Verify first.
      const { webhooks, complete } = await getAllWebhooks()
      const stillLive = webhooks.some(w => w.gid === existing.webhookId)

      // Only absence proven against a COMPLETE list is a ghost. Deleting on a
      // partial or failed listing would destroy a working record's secret.
      if (stillLive || !complete) {
        if (!complete) {
          console.warn(`Could not fully list Asana webhooks while checking project ${gid} — keeping the local record`)
          logEvent({
            level: 'warn',
            event: 'webhook.ghost_check_skipped',
            projectGid: gid,
            message: 'Could not list Asana webhooks, so the existing record was kept rather than risk deleting a live one'
          })
        }
        return res.status(409).json({ message: 'This project already has a webhook registered.' })
      }

      console.warn(`Removing stale webhook record for project ${gid} (webhook ${existing.webhookId} no longer exists in Asana)`)
      logEvent({
        level: 'warn',
        event: 'webhook.ghost_removed',
        projectGid: gid,
        message: `Stale record removed — webhook ${existing.webhookId} no longer exists in Asana`,
        detail: { webhookId: existing.webhookId }
      })
      WebhookRepository.delete({ _id: existing._id })
    }

    const result = await getProjectById(gid)
    const { gid: projectGid, name } = result.data
    res.json({ gid: projectGid, name })
  } catch (error) {
    console.error('Error looking up project:', formatAsanaError(error))
    res.status(404).json({ message: 'Project not found. Check the URL or GID and try again.' })
  }
}

/**
 * Best-effort health check run right after registration, so a project can never
 * register into a silently-broken state (the Marzano EC failure mode: the
 * webhook registers fine, then every write is refused with 403).
 * Never throws — warnings are a bonus, not a precondition.
 */
async function preflight (gid, projectName) {
  try {
    const { checks } = await checkProject(gid)
    const warnings = checks
      .filter(c => c.status === 'fail')
      .map(c => ({ id: c.id, label: c.label, message: c.message, fix: c.fix }))

    if (warnings.length) {
      logEvent({
        level: 'warn',
        event: 'preflight.warned',
        projectGid: gid,
        projectName,
        message: `Registered with ${warnings.length} problem(s): ${warnings.map(w => w.id).join(', ')}`,
        detail: { warnings }
      })
    }

    return warnings
  } catch (error) {
    console.warn(`Preflight check failed for project ${gid}:`, formatAsanaError(error))
    return []
  }
}

export async function registerWebhookUI (req, res) {
  const { gid } = req.body
  if (!gid) return res.status(400).json({ message: 'Project GID is required' })

  let projectName = null
  let webhookUUID
  try {
    webhookUUID = WebhookRepository.create({ path: '/first-response-time', resourceId: gid })
    const response = await createFRTWebhook(gid)
    const { gid: webhookId, resource: { resource_type: resourceType, name: resourceName } } = response.data
    projectName = resourceName ?? null
    WebhookRepository.update(webhookUUID, { webhookId, resourceType })
    logEvent({
      event: 'webhook.registered',
      projectGid: gid,
      projectName,
      message: `FRT webhook registered by ${req.user?.email ?? 'unknown user'}`,
      detail: { path: '/first-response-time', webhookId }
    })
  } catch (error) {
    if (webhookUUID) WebhookRepository.delete({ _id: webhookUUID })
    console.error('Error registering webhook:', formatAsanaError(error))
    return res.status(500).json({ message: 'Failed to register webhook' })
  }

  let urgentWebhookUUID
  try {
    urgentWebhookUUID = WebhookRepository.create({ path: '/urgent-request', resourceId: gid })
    const urgentResponse = await createURWebhook(gid)
    const { gid: urgentWebhookId, resource: { resource_type: urgentResourceType } } = urgentResponse.data
    WebhookRepository.update(urgentWebhookUUID, { webhookId: urgentWebhookId, resourceType: urgentResourceType })
    logEvent({
      event: 'webhook.registered',
      projectGid: gid,
      projectName,
      message: `Urgent Keyword webhook registered by ${req.user?.email ?? 'unknown user'}`,
      detail: { path: '/urgent-request', webhookId: urgentWebhookId }
    })
  } catch (error) {
    if (urgentWebhookUUID) WebhookRepository.delete({ _id: urgentWebhookUUID })
    console.error('Error registering urgent-keyword webhook:', formatAsanaError(error))
    const warnings = await preflight(gid, projectName)
    return res.status(201).json({
      message: 'Webhook registered, but urgent-keyword detection could not be set up automatically (check server logs)',
      warnings
    })
  }

  const warnings = await preflight(gid, projectName)
  res.status(201).json({ message: 'Webhook registered successfully', warnings })
}

export async function deleteWebhookUI (req, res) {
  try {
    const { id } = req.params
    const record = WebhookRepository.findAll().find(w => w.webhookId === id)
    try {
      await deleteWebhook(id)
    } catch (asanaError) {
      // If Asana says the webhook is already gone, that's fine — still clean up locally
      console.warn(`Asana webhook delete warning (${id}):`, formatAsanaError(asanaError))
    }
    WebhookRepository.delete({ webhookId: id })
    logEvent({
      level: 'warn',
      event: 'webhook.deleted',
      projectGid: record?.resourceId ?? null,
      message: `Webhook ${id} deleted by ${req.user?.email ?? 'unknown user'}`,
      detail: { path: record?.path ?? null, webhookId: id }
    })
    res.json({ message: 'Webhook deleted' })
  } catch (error) {
    console.error('Error deleting webhook:', formatAsanaError(error))
    res.sendStatus(500)
  }
}

export function getEventsUI (req, res) {
  try {
    const { limit, project, level } = req.query
    const parsedLimit = Math.min(Number(limit) || 200, 1000)

    res.json({
      retentionDays: RETENTION_DAYS,
      events: readEvents({
        limit: parsedLimit,
        projectGid: project || null,
        level: level || null
      })
    })
  } catch (error) {
    console.error('Error reading the event log:', error.message)
    res.sendStatus(500)
  }
}

export async function getDiagnosticsUI (req, res) {
  try {
    const { gid } = req.params
    res.json(await checkProject(gid))
  } catch (error) {
    console.error('Error running diagnostics:', formatAsanaError(error))
    res.status(500).json({ message: 'Diagnostics could not be run' })
  }
}

export async function getBotIdentityUI (req, res) {
  try {
    res.json(await getBotIdentity())
  } catch (error) {
    console.error('Error reading the server Asana identity:', formatAsanaError(error))
    res.status(500).json({ message: "Could not read the server's Asana identity" })
  }
}
