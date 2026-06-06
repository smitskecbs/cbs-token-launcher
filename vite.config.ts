import { defineConfig, loadEnv, type Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleAdminApi } from './api/lib/adminRouter.js'
import { handlePublicApi } from './api/lib/publicRouter.js'
import {
  buildVercelLikeRequest,
  createVercelLikeResponse,
} from './api/lib/createVercelLikeResponse.js'
import {
  insertSubmitLaunchRecord,
  validateSubmitLaunchPayload,
} from './api/lib/submitLaunchCore.js'
import { notifyAdminOfNewSubmission } from './api/lib/telegramNotify.js'

async function forwardToApiHandler(
  req: IncomingMessage,
  res: ServerResponse,
  url: string,
  handler: typeof handleAdminApi,
  env: Record<string, string>,
): Promise<void> {
  const vercelReq = buildVercelLikeRequest(req, url)
  await handler(vercelReq, createVercelLikeResponse(res), env)
}

function adminApiProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-admin-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/admin')) {
          next()
          return
        }

        await forwardToApiHandler(req, res, req.url, handleAdminApi, env)
      })
    },
  }
}

function publicApiProxyPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'dev-public-api-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/public')) {
          next()
          return
        }

        await forwardToApiHandler(req, res, req.url, handlePublicApi, env)
      })
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

          if (result.ok) {
            await notifyAdminOfNewSubmission(env, validation.data)
          }

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
    base: '/',
    plugins: [
      rpcProxyPlugin(env.HELIUS_MAINNET_RPC?.trim()),
      publicApiProxyPlugin(env),
      adminApiProxyPlugin(env),
      submitLaunchProxyPlugin(env),
    ],
  }
})
