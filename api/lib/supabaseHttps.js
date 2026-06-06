import https from 'node:https'

export const SUPABASE_HTTPS_TIMEOUT_MS = 8000

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
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

export function buildLaunchSubmissionsRestUrl(supabaseUrl) {
  const normalized = normalizeSupabaseUrl(supabaseUrl)

  if (!normalized) {
    return null
  }

  return `${normalized}/rest/v1/launch_submissions`
}

export function readSupabaseEnv(env) {
  return {
    supabaseUrl: trimString(env?.SUPABASE_URL),
    serviceRoleKey: trimString(env?.SUPABASE_SERVICE_ROLE_KEY),
  }
}

export function logMissingSupabaseEnv(env, logPrefix) {
  const missing = []

  if (!trimString(env?.SUPABASE_URL)) {
    missing.push('SUPABASE_URL')
  }

  if (!trimString(env?.SUPABASE_SERVICE_ROLE_KEY)) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY')
  }

  if (missing.length > 0) {
    console.error(`${logPrefix} Missing env: ${missing.join(', ')}`)
  }
}

export function getJsonWithHttps(restUrl, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(restUrl)

    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'GET',
        headers,
        timeout: SUPABASE_HTTPS_TIMEOUT_MS,
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
      reject(
        new Error(
          `Supabase request timed out after ${SUPABASE_HTTPS_TIMEOUT_MS}ms`,
        ),
      )
    })

    request.on('error', reject)
    request.end()
  })
}

export function patchJsonWithHttps(restUrl, headers, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(restUrl)
    const payload = JSON.stringify(body)

    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'PATCH',
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(payload),
        },
        timeout: SUPABASE_HTTPS_TIMEOUT_MS,
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
      reject(
        new Error(
          `Supabase request timed out after ${SUPABASE_HTTPS_TIMEOUT_MS}ms`,
        ),
      )
    })

    request.on('error', reject)
    request.write(payload)
    request.end()
  })
}

export function deleteJsonWithHttps(restUrl, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(restUrl)

    const request = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: 'DELETE',
        headers,
        timeout: SUPABASE_HTTPS_TIMEOUT_MS,
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
      reject(
        new Error(
          `Supabase request timed out after ${SUPABASE_HTTPS_TIMEOUT_MS}ms`,
        ),
      )
    })

    request.on('error', reject)
    request.end()
  })
}
