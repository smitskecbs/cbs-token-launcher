import {
  buildLaunchSubmissionsRestUrl,
  getJsonWithHttps,
  logMissingSupabaseEnv,
  readSupabaseEnv,
} from './supabaseHttps.js'

const LOG_PREFIX = '[list-launch-submissions]'

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

export async function listLaunchSubmissions(env) {
  const { supabaseUrl, serviceRoleKey } = readSupabaseEnv(env)

  if (!supabaseUrl || !serviceRoleKey) {
    logMissingSupabaseEnv(env, LOG_PREFIX)
    return {
      ok: false,
      status: 500,
      message: 'Submission service is not configured.',
    }
  }

  const baseUrl = buildLaunchSubmissionsRestUrl(supabaseUrl)

  if (!baseUrl) {
    console.error(`${LOG_PREFIX} Invalid SUPABASE_URL host configuration`)
    return {
      ok: false,
      status: 500,
      message: 'Submission service is not configured.',
    }
  }

  const query = new URLSearchParams({
    select: 'id,project_name,token_symbol,mint_address,status,created_at',
    order: 'created_at.desc',
  })

  const restUrl = `${baseUrl}?${query.toString()}`

  try {
    console.log(
      `${LOG_PREFIX} Supabase GET host: ${new URL(restUrl).host}`,
    )

    const upstream = await getJsonWithHttps(restUrl, {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: 'application/json',
    })

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${LOG_PREFIX} Supabase status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not load submissions right now. Please try again later.',
      }
    }

    let rows

    try {
      rows = JSON.parse(upstream.body)
    } catch {
      console.error(`${LOG_PREFIX} Supabase response was not valid JSON`)
      return {
        ok: false,
        status: 502,
        message: 'Could not load submissions right now. Please try again later.',
      }
    }

    if (!Array.isArray(rows)) {
      console.error(`${LOG_PREFIX} Supabase response was not an array`)
      return {
        ok: false,
        status: 502,
        message: 'Could not load submissions right now. Please try again later.',
      }
    }

    const submissions = rows.map(mapSubmissionRow)

    console.log(`${LOG_PREFIX} loaded ${submissions.length} submissions`)

    return {
      ok: true,
      status: 200,
      count: submissions.length,
      submissions,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Supabase request failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not load submissions right now. Please try again later.',
    }
  }
}
