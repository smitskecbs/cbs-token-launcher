import {
  buildLaunchSubmissionsRestUrl,
  deleteJsonWithHttps,
  getJsonWithHttps,
  logMissingSupabaseEnv,
  postJsonWithHttps,
  readSupabaseEnv,
} from './supabaseHttps.js'

const LOG_PREFIX = '[launch-updates]'

const SUBMISSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const LAUNCH_ID_PATTERN = /^[a-z0-9-]{1,64}$/i
const UPDATE_ID_PATTERN = SUBMISSION_ID_PATTERN

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidSubmissionId(value) {
  return SUBMISSION_ID_PATTERN.test(value)
}

function isValidLaunchId(value) {
  return LAUNCH_ID_PATTERN.test(value)
}

function isValidUpdateId(value) {
  return UPDATE_ID_PATTERN.test(value)
}

function getSupabaseConfig(env) {
  const { supabaseUrl, serviceRoleKey } = readSupabaseEnv(env)

  if (!supabaseUrl || !serviceRoleKey) {
    logMissingSupabaseEnv(env, LOG_PREFIX)
    return null
  }

  const submissionsUrl = buildLaunchSubmissionsRestUrl(supabaseUrl)

  if (!submissionsUrl) {
    console.error(`${LOG_PREFIX} Invalid SUPABASE_URL host configuration`)
    return null
  }

  const origin = new URL(submissionsUrl).origin

  return {
    serviceRoleKey,
    updatesUrl: `${origin}/rest/v1/launch_updates`,
  }
}

function buildAuthHeaders(serviceRoleKey, prefer = 'return=minimal') {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Prefer: prefer,
  }
}

function mapUpdateRow(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    submissionId: row.submission_id ?? null,
    launchId: row.launch_id ?? null,
  }
}

function resolveLaunchTarget(body) {
  const submissionId = trimString(body?.submissionId)
  const launchId = trimString(body?.launchId)

  if (submissionId && launchId) {
    return {
      ok: false,
      status: 400,
      message: 'Provide either submissionId or launchId, not both.',
    }
  }

  if (submissionId) {
    if (!isValidSubmissionId(submissionId)) {
      return {
        ok: false,
        status: 400,
        message: 'Submission id is invalid.',
      }
    }

    return {
      ok: true,
      filterKey: 'submission_id',
      filterValue: submissionId,
      payload: { submission_id: submissionId, launch_id: null },
    }
  }

  if (launchId) {
    if (!isValidLaunchId(launchId)) {
      return {
        ok: false,
        status: 400,
        message: 'Launch id is invalid.',
      }
    }

    return {
      ok: true,
      filterKey: 'launch_id',
      filterValue: launchId,
      payload: { launch_id: launchId, submission_id: null },
    }
  }

  return {
    ok: false,
    status: 400,
    message: 'Submission id or launch id is required.',
  }
}

function parseLatestLimit(value) {
  if (value === undefined || value === null || value === '') {
    return null
  }

  const parsed = Number.parseInt(String(value), 10)

  if (!Number.isFinite(parsed) || parsed < 1) {
    return null
  }

  return Math.min(parsed, 20)
}

export async function listLaunchUpdates(env, queryParams = {}) {
  const submissionId = trimString(queryParams.submissionId)
  const launchId = trimString(queryParams.launchId)
  const latestLimit = parseLatestLimit(queryParams.latest)

  if (submissionId && launchId) {
    return {
      ok: false,
      status: 400,
      message: 'Provide either submissionId or launchId, not both.',
    }
  }

  if (!submissionId && !launchId) {
    if (!latestLimit) {
      return {
        ok: false,
        status: 400,
        message: 'Submission id, launch id, or latest limit is required.',
      }
    }

    return listLatestLaunchUpdates(env, latestLimit)
  }

  if (submissionId && !isValidSubmissionId(submissionId)) {
    return {
      ok: false,
      status: 400,
      message: 'Submission id is invalid.',
    }
  }

  if (launchId && !isValidLaunchId(launchId)) {
    return {
      ok: false,
      status: 400,
      message: 'Launch id is invalid.',
    }
  }

  const config = getSupabaseConfig(env)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Launch updates service is not configured.',
    }
  }

  const query = new URLSearchParams({
    select: 'id,submission_id,launch_id,title,content,created_at',
    order: 'created_at.desc',
  })

  if (submissionId) {
    query.set('submission_id', `eq.${submissionId}`)
  } else {
    query.set('launch_id', `eq.${launchId}`)
  }

  const restUrl = `${config.updatesUrl}?${query.toString()}`

  try {
    const upstream = await getJsonWithHttps(
      restUrl,
      buildAuthHeaders(config.serviceRoleKey),
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${LOG_PREFIX} list status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not load launch updates right now.',
      }
    }

    const rows = JSON.parse(upstream.body)
    const updates = Array.isArray(rows) ? rows.map(mapUpdateRow) : []

    return {
      ok: true,
      status: 200,
      count: updates.length,
      updates,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} list failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not load launch updates right now.',
    }
  }
}

async function listLatestLaunchUpdates(env, limit) {
  const config = getSupabaseConfig(env)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Launch updates service is not configured.',
    }
  }

  const query = new URLSearchParams({
    select: 'id,submission_id,launch_id,title,content,created_at',
    order: 'created_at.desc',
    limit: String(limit),
  })

  const restUrl = `${config.updatesUrl}?${query.toString()}`

  try {
    const upstream = await getJsonWithHttps(
      restUrl,
      buildAuthHeaders(config.serviceRoleKey),
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${LOG_PREFIX} latest list status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not load launch updates right now.',
      }
    }

    const rows = JSON.parse(upstream.body)
    const updates = Array.isArray(rows) ? rows.map(mapUpdateRow) : []

    return {
      ok: true,
      status: 200,
      count: updates.length,
      updates,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} latest list failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not load launch updates right now.',
    }
  }
}

export async function createLaunchUpdate(env, body) {
  const title = trimString(body?.title)
  const content = trimString(body?.content)

  if (!title) {
    return {
      ok: false,
      status: 400,
      message: 'Title is required.',
    }
  }

  if (title.length > 200) {
    return {
      ok: false,
      status: 400,
      message: 'Title must be 200 characters or fewer.',
    }
  }

  if (!content) {
    return {
      ok: false,
      status: 400,
      message: 'Update text is required.',
    }
  }

  if (content.length > 5000) {
    return {
      ok: false,
      status: 400,
      message: 'Update text must be 5000 characters or fewer.',
    }
  }

  const target = resolveLaunchTarget(body)

  if (!target.ok) {
    return target
  }

  const config = getSupabaseConfig(env)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Launch updates service is not configured.',
    }
  }

  try {
    const upstream = await postJsonWithHttps(
      config.updatesUrl,
      buildAuthHeaders(config.serviceRoleKey, 'return=representation'),
      {
        ...target.payload,
        title,
        content,
      },
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${LOG_PREFIX} create status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not save launch update right now.',
      }
    }

    const rows = JSON.parse(upstream.body)
    const created = Array.isArray(rows) && rows[0] ? mapUpdateRow(rows[0]) : null

    if (!created) {
      return {
        ok: false,
        status: 502,
        message: 'Could not save launch update right now.',
      }
    }

    console.log(`${LOG_PREFIX} created update ${created.id}`)

    return {
      ok: true,
      status: 201,
      update: created,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} create failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not save launch update right now.',
    }
  }
}

export async function deleteLaunchUpdate(env, updateId) {
  const trimmedId = trimString(updateId)

  if (!isValidUpdateId(trimmedId)) {
    return {
      ok: false,
      status: 400,
      message: 'Update id is invalid.',
    }
  }

  const config = getSupabaseConfig(env)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Launch updates service is not configured.',
    }
  }

  const query = new URLSearchParams({
    id: `eq.${trimmedId}`,
  })
  const restUrl = `${config.updatesUrl}?${query.toString()}`

  try {
    const upstream = await deleteJsonWithHttps(
      restUrl,
      buildAuthHeaders(config.serviceRoleKey),
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${LOG_PREFIX} delete status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not delete launch update right now.',
      }
    }

    console.log(`${LOG_PREFIX} deleted update ${trimmedId}`)

    return {
      ok: true,
      status: 200,
      id: trimmedId,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} delete failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not delete launch update right now.',
    }
  }
}
