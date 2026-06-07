import {
  buildLaunchSubmissionsRestUrl,
  getJsonWithHttps,
  logMissingSupabaseEnv,
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

  let rows

  try {
    rows = JSON.parse(upstream.body)
  } catch {
    return {}
  }

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

  if (!isValidLaunchId(trimmedLaunchId)) {
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
      message: 'Analytics service is not configured.',
    }
  }

  try {
    const upstream = await postJsonWithHttps(
      config.rpcUrl,
      buildAuthHeaders(config.serviceRoleKey, 'return=representation'),
      { p_launch_id: trimmedLaunchId },
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${LOG_PREFIX} increment status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not record page view right now.',
      }
    }

    let pageViews = 1

    try {
      const payload = JSON.parse(upstream.body)

      if (typeof payload === 'number') {
        pageViews = Math.max(1, payload)
      }
    } catch {
      // Keep default when RPC returns empty body
    }

    console.log(
      `${LOG_PREFIX} incremented ${trimmedLaunchId} to ${pageViews} page views`,
    )

    return {
      ok: true,
      status: 200,
      launchId: trimmedLaunchId,
      pageViews,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} increment failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not record page view right now.',
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
