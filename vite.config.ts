import { defineConfig, loadEnv, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  ADMIN_SESSION_TTL_MS,
  createAdminSessionToken,
  getAdminPassword,
  getBearerTokenFromHeaders,
  verifyAdminPassword,
  verifyAdminSessionToken,
} from './api/lib/adminSession.js'
import {
  listHomepageLaunches,
  listLaunchSubmissions,
  updateLaunchSubmissionDetails,
  updateLaunchSubmissionStatus,
  updateLaunchSubmissionFeatured,
  updateLaunchSubmissionVerified,
} from './api/lib/launchSubmissionsDb.js'
import { getTokenMarketData } from './api/lib/tokenMarketData.js'
import {
  insertSubmitLaunchRecord,
  validateAdminEditSubmissionPayload,
  validateSubmitLaunchPayload,
} from './api/lib/submitLaunchCore.js'

function sendJson(
  res: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

function checkAdminAuth(
  req: IncomingMessage,
  env: Record<string, string>,
): { ok: true } | { ok: false; status: number; message: string } {
  const adminPassword = getAdminPassword(env)

  if (!adminPassword) {
    return {
      ok: false,
      status: 500,
      message: 'Admin authentication is not configured.',
    }
  }

  const token = getBearerTokenFromHeaders(req.headers)

  if (!token || !verifyAdminSessionToken(token, adminPassword)) {
    return {
      ok: false,
      status: 401,
      message: 'Admin authentication required.',
    }
  }

  return { ok: true }
}

function adminLoginProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-admin-login-proxy',
    configureServer(server) {
      server.middlewares.use('/api/admin-login', async (req, res, next) => {
        if (!req.url?.startsWith('/api/admin-login')) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        const adminPassword = getAdminPassword(env)

        if (!adminPassword) {
          sendJson(res, 500, { error: 'Admin authentication is not configured.' })
          return
        }

        try {
          const chunks: Buffer[] = []

          await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => chunks.push(chunk))
            req.on('end', () => resolve())
            req.on('error', reject)
          })

          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : null
          const password =
            typeof body?.password === 'string' ? body.password : ''

          if (!verifyAdminPassword(password, adminPassword)) {
            sendJson(res, 401, { error: 'Invalid admin password.' })
            return
          }

          const token = createAdminSessionToken(adminPassword)

          sendJson(res, 200, {
            ok: true,
            token,
            expiresInMs: ADMIN_SESSION_TTL_MS,
          })
        } catch {
          sendJson(res, 400, { error: 'Invalid request body.' })
        }
      })
    },
  }
}

function tokenMarketDataProxyPlugin(): Plugin {
  return {
    name: 'dev-token-market-data-proxy',
    configureServer(server) {
      server.middlewares.use('/api/token-market-data', async (req, res, next) => {
        if (!req.url?.startsWith('/api/token-market-data')) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'GET') {
          sendJson(res, 405, { error: 'Method not allowed' })
          return
        }

        const requestUrl = new URL(req.url, 'http://localhost')
        const mint = requestUrl.searchParams.get('mint')?.trim() ?? ''
        const result = await getTokenMarketData(mint)

        res.statusCode = result.ok ? 200 : result.status
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify(
            result.ok
              ? {
                  ok: true,
                  cached: result.cached === true,
                  data: result.data,
                }
              : { error: result.message },
          ),
        )
      })
    },
  }
}

function homepageLaunchesProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-homepage-launches-proxy',
    configureServer(server) {
      server.middlewares.use('/api/homepage-launches', async (req, res, next) => {
        if (!req.url?.startsWith('/api/homepage-launches')) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'GET') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        const result = await listHomepageLaunches(env)

        res.statusCode = result.ok ? 200 : result.status
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify(
            result.ok
              ? {
                  ok: true,
                  count: result.count,
                  launches: result.launches,
                }
              : { error: result.message },
          ),
        )
      })
    },
  }
}

function listLaunchSubmissionsProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-list-launch-submissions-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/list-launch-submissions',
        async (req, res, next) => {
          if (!req.url?.startsWith('/api/list-launch-submissions')) {
            next()
            return
          }

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method !== 'GET') {
            sendJson(res, 405, { error: 'Method not allowed' })
            return
          }

          const auth = checkAdminAuth(req, env)

          if (!auth.ok) {
            sendJson(res, auth.status, { error: auth.message })
            return
          }

          const result = await listLaunchSubmissions(env)

          res.statusCode = result.ok ? 200 : result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify(
              result.ok
                ? {
                    ok: true,
                    count: result.count,
                    submissions: result.submissions,
                  }
                : { error: result.message },
            ),
          )
        },
      )
    },
  }
}

function updateLaunchSubmissionStatusProxyPlugin(
  env: Record<string, string>,
): Plugin {
  return {
    name: 'dev-update-launch-submission-status-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/update-launch-submission-status',
        async (req, res, next) => {
          if (!req.url?.startsWith('/api/update-launch-submission-status')) {
            next()
            return
          }

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method !== 'PATCH') {
            sendJson(res, 405, { error: 'Method not allowed' })
            return
          }

          const auth = checkAdminAuth(req, env)

          if (!auth.ok) {
            sendJson(res, auth.status, { error: auth.message })
            return
          }

          try {
            const chunks: Buffer[] = []

            await new Promise<void>((resolve, reject) => {
              req.on('data', (chunk: Buffer) => chunks.push(chunk))
              req.on('end', () => resolve())
              req.on('error', reject)
            })

            const raw = Buffer.concat(chunks).toString('utf8')
            const body = raw ? JSON.parse(raw) : null
            const result = await updateLaunchSubmissionStatus(
              env,
              body?.id,
              body?.status,
            )

            res.statusCode = result.ok ? 200 : result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify(
                result.ok
                  ? {
                      ok: true,
                      id: result.id,
                      status: result.statusValue,
                    }
                  : { error: result.message },
              ),
            )
          } catch {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Invalid request body.' }))
          }
        },
      )
    },
  }
}

function updateLaunchSubmissionDetailsProxyPlugin(
  env: Record<string, string>,
): Plugin {
  return {
    name: 'dev-update-launch-submission-details-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/update-launch-submission-details',
        async (req, res, next) => {
          if (!req.url?.startsWith('/api/update-launch-submission-details')) {
            next()
            return
          }

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method !== 'PATCH') {
            sendJson(res, 405, { error: 'Method not allowed' })
            return
          }

          const auth = checkAdminAuth(req, env)

          if (!auth.ok) {
            sendJson(res, auth.status, { error: auth.message })
            return
          }

          try {
            const chunks: Buffer[] = []

            await new Promise<void>((resolve, reject) => {
              req.on('data', (chunk: Buffer) => chunks.push(chunk))
              req.on('end', () => resolve())
              req.on('error', reject)
            })

            const raw = Buffer.concat(chunks).toString('utf8')
            const body = raw ? JSON.parse(raw) : null
            const submissionId =
              typeof body?.id === 'string' ? body.id.trim() : ''

            if (!submissionId) {
              sendJson(res, 400, { error: 'Submission id is required.' })
              return
            }

            const validation = validateAdminEditSubmissionPayload(body)

            if (!validation.ok) {
              sendJson(res, 400, { error: validation.message })
              return
            }

            const result = await updateLaunchSubmissionDetails(
              env,
              submissionId,
              validation.data,
            )

            res.statusCode = result.ok ? 200 : result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify(
                result.ok
                  ? {
                      ok: true,
                      id: result.id,
                    }
                  : { error: result.message },
              ),
            )
          } catch {
            sendJson(res, 400, { error: 'Invalid request body.' })
          }
        },
      )
    },
  }
}

function updateLaunchSubmissionFeaturedProxyPlugin(
  env: Record<string, string>,
): Plugin {
  return {
    name: 'dev-update-launch-submission-featured-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/update-launch-submission-featured',
        async (req, res, next) => {
          if (!req.url?.startsWith('/api/update-launch-submission-featured')) {
            next()
            return
          }

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method !== 'PATCH') {
            sendJson(res, 405, { error: 'Method not allowed' })
            return
          }

          const auth = checkAdminAuth(req, env)

          if (!auth.ok) {
            sendJson(res, auth.status, { error: auth.message })
            return
          }

          try {
            const chunks: Buffer[] = []

            await new Promise<void>((resolve, reject) => {
              req.on('data', (chunk: Buffer) => chunks.push(chunk))
              req.on('end', () => resolve())
              req.on('error', reject)
            })

            const raw = Buffer.concat(chunks).toString('utf8')
            const body = raw ? JSON.parse(raw) : null
            const result = await updateLaunchSubmissionFeatured(
              env,
              body?.id,
              body?.featured,
            )

            res.statusCode = result.ok ? 200 : result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify(
                result.ok
                  ? {
                      ok: true,
                      id: result.id,
                      featured: result.featured,
                    }
                  : { error: result.message },
              ),
            )
          } catch {
            sendJson(res, 400, { error: 'Invalid request body.' })
          }
        },
      )
    },
  }
}

function updateLaunchSubmissionVerifiedProxyPlugin(
  env: Record<string, string>,
): Plugin {
  return {
    name: 'dev-update-launch-submission-verified-proxy',
    configureServer(server) {
      server.middlewares.use(
        '/api/update-launch-submission-verified',
        async (req, res, next) => {
          if (!req.url?.startsWith('/api/update-launch-submission-verified')) {
            next()
            return
          }

          if (req.method === 'OPTIONS') {
            res.statusCode = 204
            res.end()
            return
          }

          if (req.method !== 'PATCH') {
            sendJson(res, 405, { error: 'Method not allowed' })
            return
          }

          const auth = checkAdminAuth(req, env)

          if (!auth.ok) {
            sendJson(res, auth.status, { error: auth.message })
            return
          }

          try {
            const chunks: Buffer[] = []

            await new Promise<void>((resolve, reject) => {
              req.on('data', (chunk: Buffer) => chunks.push(chunk))
              req.on('end', () => resolve())
              req.on('error', reject)
            })

            const raw = Buffer.concat(chunks).toString('utf8')
            const body = raw ? JSON.parse(raw) : null
            const result = await updateLaunchSubmissionVerified(
              env,
              body?.id,
              body?.verified,
            )

            res.statusCode = result.ok ? 200 : result.status
            res.setHeader('Content-Type', 'application/json')
            res.end(
              JSON.stringify(
                result.ok
                  ? {
                      ok: true,
                      id: result.id,
                      verified: result.verified,
                    }
                  : { error: result.message },
              ),
            )
          } catch {
            sendJson(res, 400, { error: 'Invalid request body.' })
          }
        },
      )
    },
  }
}

function submitLaunchProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-submit-launch-proxy',
    configureServer(server) {
      server.middlewares.use('/api/submit-launch', async (req, res, next) => {
        if (!req.url?.startsWith('/api/submit-launch')) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        try {
          const chunks: Buffer[] = []

          await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => chunks.push(chunk))
            req.on('end', () => resolve())
            req.on('error', reject)
          })

          const raw = Buffer.concat(chunks).toString('utf8')
          const body = raw ? JSON.parse(raw) : null
          const validation = validateSubmitLaunchPayload(body)

          if (!validation.ok) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: validation.message }))
            return
          }

          const result = await insertSubmitLaunchRecord(env, validation.data)

          res.statusCode = result.ok ? 201 : result.status
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify(
              result.ok ? { ok: true } : { error: result.message },
            ),
          )
        } catch {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid request body.' }))
        }
      })
    },
  }
}

function rpcProxyPlugin(heliusMainnetRpc: string | undefined): Plugin {
  return {
    name: 'dev-rpc-proxy',
    configureServer(server) {
      server.middlewares.use('/api/rpc', async (req, res, next) => {
        if (!req.url?.startsWith('/api/rpc')) {
          next()
          return
        }

        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }

        if (!heliusMainnetRpc) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Mainnet RPC is not configured.' }))
          return
        }

        try {
          const chunks: Buffer[] = []

          await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk: Buffer) => chunks.push(chunk))
            req.on('end', () => resolve())
            req.on('error', reject)
          })

          const body = Buffer.concat(chunks).toString('utf8')

          const upstream = await fetch(heliusMainnetRpc, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body,
          })

          const responseText = await upstream.text()

          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(responseText)
        } catch {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'RPC upstream unavailable' }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    appType: 'spa',
    // Absolute base so nested SPA routes (/admin/submissions, /token/:id)
    // load /assets/* from site root instead of a relative subpath.
    base: '/',
    plugins: [
      rpcProxyPlugin(env.HELIUS_MAINNET_RPC?.trim()),
      tokenMarketDataProxyPlugin(),
      submitLaunchProxyPlugin(env),
      homepageLaunchesProxyPlugin(env),
      adminLoginProxyPlugin(env),
      listLaunchSubmissionsProxyPlugin(env),
      updateLaunchSubmissionStatusProxyPlugin(env),
      updateLaunchSubmissionDetailsProxyPlugin(env),
      updateLaunchSubmissionFeaturedProxyPlugin(env),
      updateLaunchSubmissionVerifiedProxyPlugin(env),
    ],
  }
})
