import {
  buildLaunchSubmissionsRestUrl,
  getJsonWithHttps,
  logMissingSupabaseEnv,
  patchJsonWithHttps,
  readSupabaseEnv,
} from './supabaseHttps.js'
import { isValidSubmissionStatus } from './submissionStatuses.js'

const LIST_LOG_PREFIX = '[list-launch-submissions]'
const HOMEPAGE_LOG_PREFIX = '[homepage-launches]'
const UPDATE_LOG_PREFIX = '[update-launch-submission-status]'

function isValidSubmissionId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

function getSupabaseConfig(env, logPrefix) {
  const { supabaseUrl, serviceRoleKey } = readSupabaseEnv(env)

  if (!supabaseUrl || !serviceRoleKey) {
    logMissingSupabaseEnv(env, logPrefix)
    return null
  }

  const baseUrl = buildLaunchSubmissionsRestUrl(supabaseUrl)

  if (!baseUrl) {
    console.error(`${logPrefix} Invalid SUPABASE_URL host configuration`)
    return null
  }

  return { serviceRoleKey, baseUrl }
}

function buildAuthHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  }
}

function mapSubmissionRow(row) {
  return {
    id: row.id,
    projectName: row.project_name,
    tokenSymbol: row.token_symbol,
    mintAddress: row.mint_address,
    status: row.status,
    createdAt: row.created_at,
  }
}

function mapHomepageSubmissionRow(row) {
  return {
    id: row.id,
    projectName: row.project_name,
    tokenSymbol: row.token_symbol,
    mintAddress: row.mint_address,
    status: row.status,
    description: row.description ?? null,
    website: row.website ?? null,
    telegram: row.telegram ?? null,
    x: row.x ?? null,
    createdAt: row.created_at,
  }
}

async function fetchSubmissionRows(env, logPrefix, query) {
  const config = getSupabaseConfig(env, logPrefix)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Launch service is not configured.',
    }
  }

  const restUrl = `${config.baseUrl}?${query.toString()}`

  try {
    console.log(`${logPrefix} Supabase GET host: ${new URL(restUrl).host}`)

    const upstream = await getJsonWithHttps(
      restUrl,
      buildAuthHeaders(config.serviceRoleKey),
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${logPrefix} Supabase status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not load launches right now. Please try again later.',
      }
    }

    let rows

    try {
      rows = JSON.parse(upstream.body)
    } catch {
      console.error(`${logPrefix} Supabase response was not valid JSON`)
      return {
        ok: false,
        status: 502,
        message: 'Could not load launches right now. Please try again later.',
      }
    }

    if (!Array.isArray(rows)) {
      console.error(`${logPrefix} Supabase response was not an array`)
      return {
        ok: false,
        status: 502,
        message: 'Could not load launches right now. Please try again later.',
      }
    }

    return { ok: true, status: 200, rows }
  } catch (error) {
    console.error(
      `${logPrefix} Supabase request failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not load launches right now. Please try again later.',
    }
  }
}

export async function listLaunchSubmissions(env) {
  const query = new URLSearchParams({
    select: 'id,project_name,token_symbol,mint_address,status,created_at',
    order: 'created_at.desc',
  })

  const result = await fetchSubmissionRows(env, LIST_LOG_PREFIX, query)

  if (!result.ok) {
    return result
  }

  const submissions = result.rows.map(mapSubmissionRow)

  console.log(`${LIST_LOG_PREFIX} loaded ${submissions.length} submissions`)

  return {
    ok: true,
    status: 200,
    count: submissions.length,
    submissions,
  }
}

export async function listHomepageLaunches(env) {
  const query = new URLSearchParams({
    select:
      'id,project_name,token_symbol,mint_address,status,description,website,telegram,x,created_at',
    status: 'in.(coming_soon,live)',
    order: 'created_at.desc',
  })

  const result = await fetchSubmissionRows(env, HOMEPAGE_LOG_PREFIX, query)

  if (!result.ok) {
    return result
  }

  const launches = result.rows
    .filter((row) => row.status === 'coming_soon' || row.status === 'live')
    .map(mapHomepageSubmissionRow)

  console.log(`${HOMEPAGE_LOG_PREFIX} loaded ${launches.length} homepage launches`)

  return {
    ok: true,
    status: 200,
    count: launches.length,
    launches,
  }
}

export async function updateLaunchSubmissionStatus(env, submissionId, status) {
  const trimmedId = typeof submissionId === 'string' ? submissionId.trim() : ''
  const trimmedStatus = typeof status === 'string' ? status.trim() : ''

  if (!isValidSubmissionId(trimmedId)) {
    return {
      ok: false,
      status: 400,
      message: 'Submission id is invalid.',
    }
  }

  if (!isValidSubmissionStatus(trimmedStatus)) {
    return {
      ok: false,
      status: 400,
      message: 'Submission status is invalid.',
    }
  }

  const config = getSupabaseConfig(env, UPDATE_LOG_PREFIX)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Submission service is not configured.',
    }
  }

  const query = new URLSearchParams({
    id: `eq.${trimmedId}`,
  })

  const restUrl = `${config.baseUrl}?${query.toString()}`

  try {
    console.log(
      `${UPDATE_LOG_PREFIX} Supabase PATCH host: ${new URL(restUrl).host}`,
    )

    const upstream = await patchJsonWithHttps(
      restUrl,
      buildAuthHeaders(config.serviceRoleKey),
      { status: trimmedStatus },
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${UPDATE_LOG_PREFIX} Supabase status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not update submission status. Please try again later.',
      }
    }

    console.log(
      `${UPDATE_LOG_PREFIX} updated ${trimmedId} to ${trimmedStatus}`,
    )

    return {
      ok: true,
      status: 200,
      id: trimmedId,
      statusValue: trimmedStatus,
    }
  } catch (error) {
    console.error(
      `${UPDATE_LOG_PREFIX} Supabase request failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not update submission status. Please try again later.',
    }
  }
}
