import https from 'node:https'

const MAX_LENGTH = {
  projectName: 120,
  tokenSymbol: 20,
  mintAddress: 64,
  website: 500,
  telegram: 200,
  x: 200,
  description: 2000,
  contactEmail: 254,
}

export const SUPABASE_FETCH_TIMEOUT_MS = 8000

const LOG_PREFIX = '[submit-launch]'

console.log(`${LOG_PREFIX} core module loaded`)

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isValidMintAddress(value) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidOptionalUrl(value) {
  if (!value) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/** Ensure SUPABASE_URL is an absolute https URL for outbound requests. */
export function normalizeSupabaseUrl(rawUrl) {
  const trimmed = trimString(rawUrl)

  if (!trimmed) {
    return null
  }

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`

  try {
    const parsed = new URL(withScheme)
    return `${parsed.origin}${parsed.pathname}`.replace(/\/$/, '')
  } catch {
    return null
  }
}

export function buildLaunchSubmissionsUrl(supabaseUrl) {
  const normalized = normalizeSupabaseUrl(supabaseUrl)

  if (!normalized) {
    return null
  }

  return `${normalized}/rest/v1/launch_submissions`
}

function logMissingEnv(env) {
  const missing = []

  if (!trimString(env?.SUPABASE_URL)) {
    missing.push('SUPABASE_URL')
  }

  if (!trimString(env?.SUPABASE_SERVICE_ROLE_KEY)) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  if (missing.length > 0) {
    console.error(`${LOG_PREFIX} Missing env: ${missing.join(', ')}`)
  }
}

function postJsonWithHttps(restUrl, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(restUrl)
    const payload = JSON.stringify(body)

    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'POST',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: SUPABASE_FETCH_TIMEOUT_MS,
      },
      (response) => {
        const chunks = []

        response.on('data', (chunk) => {
          chunks.push(chunk)
        })

        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            body: Buffer.concat(chunks).toString('utf8'),
          })
        })
      },
    )

    request.on('timeout', () => {
      request.destroy()
      reject(new Error(`Supabase request timed out after ${SUPABASE_FETCH_TIMEOUT_MS}ms`))
    })

    request.on('error', reject)
    request.write(payload)
    request.end()
  })
}

export function validateSubmitLaunchPayload(body) {
  const projectName = trimString(body?.projectName)
  const tokenSymbol = trimString(body?.tokenSymbol)
  const mintAddress = trimString(body?.mintAddress)
  const website = trimString(body?.website)
  const telegram = trimString(body?.telegram)
  const x = trimString(body?.x)
  const description = trimString(body?.description)
  const contactEmail = trimString(body?.contactEmail)

  if (!projectName) {
    return { ok: false, message: 'Project name is required.' }
  }

  if (!tokenSymbol) {
    return { ok: false, message: 'Token symbol is required.' }
  }

  if (!mintAddress) {
    return { ok: false, message: 'Mint address is required.' }
  }

  if (!isValidMintAddress(mintAddress)) {
    return { ok: false, message: 'Mint address format is invalid.' }
  }

  if (!description) {
    return { ok: false, message: 'Description is required.' }
  }

  if (projectName.length > MAX_LENGTH.projectName) {
    return { ok: false, message: 'Project name is too long.' }
  }

  if (tokenSymbol.length > MAX_LENGTH.tokenSymbol) {
    return { ok: false, message: 'Token symbol is too long.' }
  }

  if (description.length > MAX_LENGTH.description) {
    return { ok: false, message: 'Description is too long.' }
  }

  if (website && (!isValidOptionalUrl(website) || website.length > MAX_LENGTH.website)) {
    return { ok: false, message: 'Website URL is invalid.' }
  }

  if (telegram.length > MAX_LENGTH.telegram) {
    return { ok: false, message: 'Telegram value is too long.' }
  }

  if (x.length > MAX_LENGTH.x) {
    return { ok: false, message: 'X value is too long.' }
  }

  if (
    contactEmail &&
    (!isValidEmail(contactEmail) || contactEmail.length > MAX_LENGTH.contactEmail)
  ) {
    return { ok: false, message: 'Contact email is invalid.' }
  }

  return {
    ok: true,
    data: {
      project_name: projectName,
      token_symbol: tokenSymbol,
      mint_address: mintAddress,
      website: website || null,
      telegram: telegram || null,
      x: x || null,
      description,
      contact_email: contactEmail || null,
      status: 'pending',
      created_at: new Date().toISOString(),
    },
  }
}

export async function insertSubmitLaunchRecord(env, record) {
  const supabaseUrl = trimString(env?.SUPABASE_URL)
  const serviceRoleKey = trimString(env?.SUPABASE_SERVICE_ROLE_KEY)

  console.log(`${LOG_PREFIX} env configured:`, {
    supabaseUrl: Boolean(supabaseUrl),
    serviceRoleKey: Boolean(serviceRoleKey),
  })

  if (!supabaseUrl || !serviceRoleKey) {
    logMissingEnv(env)
    return {
      ok: false,
      status: 500,
      message: 'Submission service is not configured.',
    }
  }

  const hadScheme = /^https?:\/\//i.test(supabaseUrl)
  const restUrl = buildLaunchSubmissionsUrl(supabaseUrl)

  if (!restUrl) {
    console.error(`${LOG_PREFIX} Invalid SUPABASE_URL host configuration`)
    return {
      ok: false,
      status: 500,
      message: 'Submission service is not configured.',
    }
  }

  const host = new URL(restUrl).host
  console.log(`${LOG_PREFIX} Supabase POST host: ${host}`)
  console.log(`${LOG_PREFIX} Supabase URL had https scheme in env: ${hadScheme}`)

  try {
    const upstream = await postJsonWithHttps(
      restUrl,
      {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      record,
    )

    if (upstream.status < 200 || upstream.status >= 300) {
      const errorText = upstream.body.trim().slice(0, 500)
      console.error(
        `${LOG_PREFIX} Supabase status: ${upstream.status}`,
        errorText || '(empty response body)',
      )

      return {
        ok: false,
        status: 502,
        message: 'Could not save your submission. Please try again later.',
      }
    }

    return { ok: true, status: 201 }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Supabase request failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not save your submission. Please try again later.',
    }
  }
}
