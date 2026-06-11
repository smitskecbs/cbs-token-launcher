import {
  buildLaunchSubmissionsRestUrl,
  getJsonWithHttps,
  logMissingSupabaseEnv,
  patchJsonWithHttps,
  postJsonWithHttps,
  readSupabaseEnv,
} from './supabaseHttps.js'

const LOG_PREFIX = '[launch-interest]'

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
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
    submissionsUrl,
    launchInterestUrl: `${origin}/rest/v1/launch_interest`,
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

async function fetchSubmissionByMint(config, mintAddress) {
  const query = new URLSearchParams({
    select: 'id,interest_count',
    mint_address: `eq.${mintAddress}`,
    limit: '1',
  })

  const restUrl = `${config.submissionsUrl}?${query.toString()}`
  const upstream = await getJsonWithHttps(
    restUrl,
    buildAuthHeaders(config.serviceRoleKey),
  )

  if (upstream.status < 200 || upstream.status >= 300) {
    return null
  }

  let rows

  try {
    rows = JSON.parse(upstream.body)
  } catch {
    return null
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return null
  }

  return rows[0]
}

async function fetchLaunchInterestRow(config, mintAddress) {
  const query = new URLSearchParams({
    select: 'mint_address,interest_count',
    mint_address: `eq.${mintAddress}`,
    limit: '1',
  })

  const restUrl = `${config.launchInterestUrl}?${query.toString()}`
  const upstream = await getJsonWithHttps(
    restUrl,
    buildAuthHeaders(config.serviceRoleKey),
  )

  if (upstream.status < 200 || upstream.status >= 300) {
    return null
  }

  let rows

  try {
    rows = JSON.parse(upstream.body)
  } catch {
    return null
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return null
  }

  return rows[0]
}

async function upsertLaunchInterest(config, mintAddress, interestCount) {
  const existing = await fetchLaunchInterestRow(config, mintAddress)
  const payload = {
    mint_address: mintAddress,
    interest_count: interestCount,
  }

  if (existing) {
    const query = new URLSearchParams({
      mint_address: `eq.${mintAddress}`,
    })
    const restUrl = `${config.launchInterestUrl}?${query.toString()}`
    const upstream = await patchJsonWithHttps(
      restUrl,
      buildAuthHeaders(config.serviceRoleKey, 'return=representation'),
      payload,
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      throw new Error(`launch_interest patch HTTP ${upstream.status}`)
    }
  } else {
    const upstream = await postJsonWithHttps(
      config.launchInterestUrl,
      buildAuthHeaders(config.serviceRoleKey, 'return=representation'),
      payload,
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      throw new Error(`launch_interest insert HTTP ${upstream.status}`)
    }
  }

  return interestCount
}

async function patchSubmissionInterest(config, submissionId, interestCount) {
  const query = new URLSearchParams({
    id: `eq.${submissionId}`,
  })

  const restUrl = `${config.submissionsUrl}?${query.toString()}`
  const upstream = await patchJsonWithHttps(
    restUrl,
    buildAuthHeaders(config.serviceRoleKey, 'return=representation'),
    { interest_count: interestCount },
  )

  if (upstream.status < 200 || upstream.status >= 300) {
    throw new Error(`submission interest patch HTTP ${upstream.status}`)
  }

  let rows

  try {
    rows = JSON.parse(upstream.body)
  } catch {
    return interestCount
  }

  if (Array.isArray(rows) && rows[0]?.interest_count != null) {
    return Number(rows[0].interest_count)
  }

  return interestCount
}

export async function incrementLaunchInterest(env, mintAddress) {
  const trimmedMint = trimString(mintAddress)

  if (!isValidMintAddress(trimmedMint)) {
    return {
      ok: false,
      status: 400,
      message: 'Mint address is invalid.',
    }
  }

  const config = getSupabaseConfig(env)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Interest service is not configured.',
    }
  }

  try {
    const submission = await fetchSubmissionByMint(config, trimmedMint)
    const catalogInterest = await fetchLaunchInterestRow(config, trimmedMint)

    const currentCount = Math.max(
      Number(submission?.interest_count) || 0,
      Number(catalogInterest?.interest_count) || 0,
    )
    const nextCount = currentCount + 1

    if (submission?.id) {
      const submissionCount = await patchSubmissionInterest(
        config,
        submission.id,
        nextCount,
      )
      await upsertLaunchInterest(config, trimmedMint, submissionCount)

      console.log(
        `${LOG_PREFIX} incremented submission ${submission.id} to ${submissionCount}`,
      )

      return {
        ok: true,
        status: 200,
        mintAddress: trimmedMint,
        interestCount: submissionCount,
      }
    }

    const catalogCount = await upsertLaunchInterest(
      config,
      trimmedMint,
      nextCount,
    )

    console.log(
      `${LOG_PREFIX} incremented catalog mint ${trimmedMint} to ${catalogCount}`,
    )

    return {
      ok: true,
      status: 200,
      mintAddress: trimmedMint,
      interestCount: catalogCount,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} increment failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not register interest right now. Please try again later.',
    }
  }
}

export async function getLaunchInterestCounts(env, mintAddresses) {
  const mints = [...new Set(mintAddresses.map(trimString).filter(isValidMintAddress))]

  if (mints.length === 0) {
    return {
      ok: true,
      status: 200,
      counts: {},
    }
  }

  const config = getSupabaseConfig(env)

  if (!config) {
    return {
      ok: false,
      status: 500,
      message: 'Interest service is not configured.',
    }
  }

  const counts = Object.fromEntries(mints.map((mint) => [mint, 0]))

  try {
    const submissionQuery = new URLSearchParams({
      select: 'mint_address,interest_count',
      mint_address: `in.(${mints.join(',')})`,
    })

    const submissionUrl = `${config.submissionsUrl}?${submissionQuery.toString()}`
    const submissionResponse = await getJsonWithHttps(
      submissionUrl,
      buildAuthHeaders(config.serviceRoleKey),
    )

    if (submissionResponse.status >= 200 && submissionResponse.status < 300) {
      const rows = JSON.parse(submissionResponse.body)

      if (Array.isArray(rows)) {
        for (const row of rows) {
          const mint = trimString(row?.mint_address)

          if (mint && counts[mint] != null) {
            counts[mint] = Math.max(
              counts[mint],
              Number(row?.interest_count) || 0,
            )
          }
        }
      }
    }

    const interestQuery = new URLSearchParams({
      select: 'mint_address,interest_count',
      mint_address: `in.(${mints.join(',')})`,
    })

    const interestUrl = `${config.launchInterestUrl}?${interestQuery.toString()}`
    const interestResponse = await getJsonWithHttps(
      interestUrl,
      buildAuthHeaders(config.serviceRoleKey),
    )

    if (interestResponse.status >= 200 && interestResponse.status < 300) {
      const rows = JSON.parse(interestResponse.body)

      if (Array.isArray(rows)) {
        for (const row of rows) {
          const mint = trimString(row?.mint_address)

          if (mint && counts[mint] != null) {
            counts[mint] = Math.max(
              counts[mint],
              Number(row?.interest_count) || 0,
            )
          }
        }
      }
    }

    return {
      ok: true,
      status: 200,
      counts,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} fetch counts failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not load interest counts right now.',
    }
  }
}
