import {
  buildLaunchSubmissionsRestUrl,
  getJsonWithHttps,
  logMissingSupabaseEnv,
  patchJsonWithHttps,
  postJsonWithHttps,
  readSupabaseEnv,
} from './supabaseHttps.js'
import { getLaunchInterestCounts } from './launchInterest.js'
import { countLaunchUpdatesForTarget } from './launchUpdatesDb.js'

const LOG_PREFIX = '[launch-analytics]'

const LAUNCH_ID_PATTERN =
  /^(?:[a-z0-9][a-z0-9-]{0,62}[a-z0-9]|submission-[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidLaunchId(value) {
  return LAUNCH_ID_PATTERN.test(value)
}

function isValidMintAddress(value) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
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
    analyticsUrl: `${origin}/rest/v1/launch_analytics`,
    rpcUrl: `${origin}/rest/v1/rpc/increment_launch_page_view`,
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

function safeParseJson(body) {
  if (!body || typeof body !== 'string') {
    return null
  }

  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

function parseSupabaseErrorResponse(status, body) {
  const payload = safeParseJson(body)
  const code =
    typeof payload?.code === 'string' ? payload.code.trim() : undefined
  const message =
    typeof payload?.message === 'string'
      ? payload.message.trim()
      : typeof payload?.error === 'string'
        ? payload.error.trim()
        : typeof payload?.hint === 'string'
          ? payload.hint.trim()
          : trimString(body).slice(0, 500) || 'Unknown Supabase error'

  return {
    status,
    code,
    message,
  }
}

function mapIncrementSupabaseError(status, body) {
  const parsed = parseSupabaseErrorResponse(status, body)
  const combined = `${parsed.code ?? ''} ${parsed.message}`.toLowerCase()

  if (
    status === 404 ||
    parsed.code === 'PGRST202' ||
    combined.includes('could not find the function') ||
    combined.includes('function not found')
  ) {
    return {
      status: 502,
      message: 'RPC function not found',
      detail: parsed.message,
      code: parsed.code,
    }
  }

  if (
    status === 401 ||
    combined.includes('invalid api key') ||
    combined.includes('jwt')
  ) {
    return {
      status: 502,
      message: 'Supabase authentication failed',
      detail: parsed.message,
      code: parsed.code,
    }
  }

  if (
    status === 403 ||
    parsed.code === '42501' ||
    combined.includes('permission denied') ||
    combined.includes('insufficient privilege')
  ) {
    return {
      status: 502,
      message: 'Supabase permission denied',
      detail: parsed.message,
      code: parsed.code,
    }
  }

  if (
    status === 404 ||
    parsed.code === 'PGRST205' ||
    combined.includes('launch_analytics') ||
    combined.includes('relation') ||
    combined.includes('does not exist')
  ) {
    return {
      status: 502,
      message: 'launch_analytics table not found',
      detail: parsed.message,
      code: parsed.code,
    }
  }

  return {
    status: status >= 400 && status < 600 ? status : 502,
    message: parsed.message || 'Supabase request failed',
    detail: parsed.message,
    code: parsed.code,
  }
}

function parseRpcPageViews(body) {
  const payload = safeParseJson(body)

  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return Math.max(1, payload)
  }

  if (Array.isArray(payload) && payload.length > 0) {
    const first = payload[0]

    if (typeof first === 'number' && Number.isFinite(first)) {
      return Math.max(1, first)
    }
  }

  const trimmed = trimString(body)

  if (/^\d+$/.test(trimmed)) {
    return Math.max(1, Number.parseInt(trimmed, 10))
  }

  return 1
}

function logSupabaseFailure(action, launchId, upstream, mappedError) {
  const parsed = parseSupabaseErrorResponse(upstream.status, upstream.body)

  console.error(`${LOG_PREFIX} ${action} failed for launchId=${launchId}`, {
    supabaseStatus: upstream.status,
    supabaseCode: parsed.code,
    supabaseMessage: parsed.message,
    mappedError: mappedError.message,
    responseBody: trimString(upstream.body).slice(0, 500) || '(empty response body)',
  })
}

async function incrementLaunchPageViewViaRest(config, launchId) {
  const headers = buildAuthHeaders(config.serviceRoleKey, 'return=representation')
  const query = new URLSearchParams({
    select: 'page_views',
    launch_id: `eq.${launchId}`,
    limit: '1',
  })
  const getUrl = `${config.analyticsUrl}?${query.toString()}`

  console.log(`${LOG_PREFIX} REST lookup host: ${new URL(getUrl).host}`, {
    launchId,
  })

  const existing = await getJsonWithHttps(getUrl, headers)

  if (existing.status < 200 || existing.status >= 300) {
    const mappedError = mapIncrementSupabaseError(existing.status, existing.body)
    logSupabaseFailure('REST lookup', launchId, existing, mappedError)
    return {
      ok: false,
      status: mappedError.status,
      message: mappedError.message,
      detail: mappedError.detail,
      code: mappedError.code,
    }
  }

  const rows = safeParseJson(existing.body)
  const hasRow = Array.isArray(rows) && rows.length > 0

  if (hasRow) {
    const currentViews = Math.max(0, Number(rows[0]?.page_views) || 0)
    const nextViews = currentViews + 1
    const patchQuery = new URLSearchParams({
      launch_id: `eq.${launchId}`,
    })
    const patchUrl = `${config.analyticsUrl}?${patchQuery.toString()}`

    console.log(`${LOG_PREFIX} REST patch host: ${new URL(patchUrl).host}`, {
      launchId,
      nextViews,
    })

    const patch = await patchJsonWithHttps(patchUrl, headers, {
      page_views: nextViews,
      updated_at: new Date().toISOString(),
    })

    if (patch.status < 200 || patch.status >= 300) {
      const mappedError = mapIncrementSupabaseError(patch.status, patch.body)
      logSupabaseFailure('REST patch', launchId, patch, mappedError)
      return {
        ok: false,
        status: mappedError.status,
        message: mappedError.message,
        detail: mappedError.detail,
        code: mappedError.code,
      }
    }

    const patchedRows = safeParseJson(patch.body)

    if (Array.isArray(patchedRows) && patchedRows[0]?.page_views != null) {
      return {
        ok: true,
        status: 200,
        launchId,
        pageViews: Math.max(1, Number(patchedRows[0].page_views) || nextViews),
        method: 'rest-patch',
      }
    }

    return {
      ok: true,
      status: 200,
      launchId,
      pageViews: nextViews,
      method: 'rest-patch',
    }
  }

  console.log(`${LOG_PREFIX} REST insert host: ${new URL(config.analyticsUrl).host}`, {
    launchId,
  })

  const created = await postJsonWithHttps(config.analyticsUrl, headers, {
    launch_id: launchId,
    page_views: 1,
  })

  if (created.status < 200 || created.status >= 300) {
    const mappedError = mapIncrementSupabaseError(created.status, created.body)
    logSupabaseFailure('REST insert', launchId, created, mappedError)
    return {
      ok: false,
      status: mappedError.status,
      message: mappedError.message,
      detail: mappedError.detail,
      code: mappedError.code,
    }
  }

  const createdRows = safeParseJson(created.body)

  if (Array.isArray(createdRows) && createdRows[0]?.page_views != null) {
    return {
      ok: true,
      status: 200,
      launchId,
      pageViews: Math.max(1, Number(createdRows[0].page_views) || 1),
      method: 'rest-insert',
    }
  }

  return {
    ok: true,
    status: 200,
    launchId,
    pageViews: 1,
    method: 'rest-insert',
  }
}

function normalizeTarget(rawTarget) {
  const launchId = trimString(rawTarget?.launchId)
  const submissionId = trimString(rawTarget?.submissionId)
  const mintAddress = trimString(rawTarget?.mintAddress)

  if (!launchId || !isValidLaunchId(launchId)) {
    return null
  }

  if (submissionId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
    return null
  }

  if (mintAddress && !isValidMintAddress(mintAddress)) {
    return null
  }

  return {
    launchId,
    submissionId: submissionId || undefined,
    mintAddress: mintAddress || undefined,
  }
}

async function fetchPageViewsByLaunchIds(config, launchIds) {
  const uniqueLaunchIds = [...new Set(launchIds)]

  if (uniqueLaunchIds.length === 0) {
    return {}
  }

  const inList = uniqueLaunchIds.map((id) => encodeURIComponent(id)).join(',')
  const query = new URLSearchParams({
    select: 'launch_id,page_views',
    launch_id: `in.(${inList})`,
  })
  const restUrl = `${config.analyticsUrl}?${query.toString()}`

  const upstream = await getJsonWithHttps(
    restUrl,
    buildAuthHeaders(config.serviceRoleKey),
  )

  if (upstream.status < 200 || upstream.status >= 300) {
    throw new Error(`launch_analytics list HTTP ${upstream.status}`)
  }

  const rows = safeParseJson(upstream.body)
  const counts = {}

  if (Array.isArray(rows)) {
    for (const row of rows) {
      if (typeof row?.launch_id === 'string') {
        counts[row.launch_id] = Math.max(0, Number(row.page_views) || 0)
      }
    }
  }

  return counts
}

export async function incrementLaunchPageView(env, launchId) {
  const trimmedLaunchId = trimString(launchId)

  console.log(`${LOG_PREFIX} received launchId=${trimmedLaunchId || '(empty)'}`)

  if (!isValidLaunchId(trimmedLaunchId)) {
    console.error(`${LOG_PREFIX} validation failed for launchId=${trimmedLaunchId || '(empty)'}`)
    return {
      ok: false,
      status: 400,
      message: 'Launch id is invalid.',
    }
  }

  const config = getSupabaseConfig(env)

  if (!config) {
    console.error(`${LOG_PREFIX} Supabase config unavailable`)
    return {
      ok: false,
      status: 500,
      message: 'Analytics service is not configured.',
    }
  }

  const rpcPayload = { p_launch_id: trimmedLaunchId }

  try {
    console.log(`${LOG_PREFIX} RPC request host: ${new URL(config.rpcUrl).host}`, {
      launchId: trimmedLaunchId,
      rpcFunction: 'increment_launch_page_view',
      payload: rpcPayload,
    })

    const upstream = await postJsonWithHttps(
      config.rpcUrl,
      buildAuthHeaders(config.serviceRoleKey, 'return=representation'),
      rpcPayload,
    )

    console.log(`${LOG_PREFIX} RPC response for launchId=${trimmedLaunchId}`, {
      supabaseStatus: upstream.status,
      responseBody: trimString(upstream.body).slice(0, 500) || '(empty response body)',
    })

    if (upstream.status >= 200 && upstream.status < 300) {
      const pageViews = parseRpcPageViews(upstream.body)

      console.log(
        `${LOG_PREFIX} RPC incremented ${trimmedLaunchId} to ${pageViews} page views`,
      )

      return {
        ok: true,
        status: 200,
        launchId: trimmedLaunchId,
        pageViews,
        method: 'rpc',
      }
    }

    const mappedError = mapIncrementSupabaseError(upstream.status, upstream.body)
    logSupabaseFailure('RPC', trimmedLaunchId, upstream, mappedError)

    console.warn(
      `${LOG_PREFIX} RPC unavailable for launchId=${trimmedLaunchId}; attempting REST fallback`,
      {
        mappedError: mappedError.message,
        supabaseCode: mappedError.code,
      },
    )

    const fallback = await incrementLaunchPageViewViaRest(config, trimmedLaunchId)

    if (fallback.ok) {
      console.log(
        `${LOG_PREFIX} REST fallback incremented ${trimmedLaunchId} to ${fallback.pageViews} page views`,
        { method: fallback.method },
      )
      return fallback
    }

    return {
      ok: false,
      status: fallback.status,
      message: fallback.message,
      detail: fallback.detail,
      code: fallback.code,
      rpcError: mappedError.message,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'unknown error'

    console.error(
      `${LOG_PREFIX} increment threw for launchId=${trimmedLaunchId}:`,
      errorMessage,
    )

    try {
      const fallback = await incrementLaunchPageViewViaRest(config, trimmedLaunchId)

      if (fallback.ok) {
        console.log(
          `${LOG_PREFIX} REST fallback after exception incremented ${trimmedLaunchId} to ${fallback.pageViews} page views`,
          { method: fallback.method },
        )
        return fallback
      }

      return {
        ok: false,
        status: fallback.status,
        message: fallback.message,
        detail: fallback.detail || errorMessage,
        code: fallback.code,
      }
    } catch (fallbackError) {
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : 'unknown fallback error'

      console.error(
        `${LOG_PREFIX} REST fallback threw for launchId=${trimmedLaunchId}:`,
        fallbackMessage,
      )

      return {
        ok: false,
        status: 502,
        message: 'Supabase request failed',
        detail: fallbackMessage || errorMessage,
      }
    }
  }
}

export async function getLaunchEngagementMetrics(env, rawTargets) {
  const targets = (Array.isArray(rawTargets) ? rawTargets : [])
    .map(normalizeTarget)
    .filter(Boolean)

  if (targets.length === 0) {
    return {
      ok: false,
      status: 400,
      message: 'At least one valid analytics target is required.',
    }
  }

  const config = getSupabaseConfig(env)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Analytics service is not configured.',
    }
  }

  try {
    const launchIds = targets.map((target) => target.launchId)
    const mintAddresses = targets
      .map((target) => target.mintAddress)
      .filter(Boolean)

    const [pageViewsByLaunchId, interestResult, ...updatesCounts] =
      await Promise.all([
        fetchPageViewsByLaunchIds(config, launchIds),
        getLaunchInterestCounts(env, mintAddresses),
        ...targets.map((target) =>
          countLaunchUpdatesForTarget(
            env,
            target.submissionId
              ? { submissionId: target.submissionId }
              : { launchId: target.launchId },
          ),
        ),
      ])

    if (!interestResult.ok) {
      return interestResult
    }

    const analytics = {}

    for (let index = 0; index < targets.length; index += 1) {
      const target = targets[index]
      const updatesResult = updatesCounts[index]

      const votes = target.mintAddress
        ? Math.max(0, Number(interestResult.counts[target.mintAddress]) || 0)
        : 0

      analytics[target.launchId] = {
        launchId: target.launchId,
        pageViews: pageViewsByLaunchId[target.launchId] ?? 0,
        votes,
        updates:
          updatesResult?.ok === true
            ? Math.max(0, Number(updatesResult.totalCount) || 0)
            : 0,
      }
    }

    return {
      ok: true,
      status: 200,
      analytics,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} metrics failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not load launch analytics right now.',
    }
  }
}
