import { defineConfig, loadEnv, type Plugin } from 'vite'
import { listLaunchSubmissions } from './api/lib/launchSubmissionsDb.js'
import {
  insertSubmitLaunchRecord,
  validateSubmitLaunchPayload,
} from './api/lib/submitLaunchCore.js'

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
            res.statusCode = 405
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Method not allowed' }))
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
      submitLaunchProxyPlugin(env),
      listLaunchSubmissionsProxyPlugin(env),
    ],
  }
})
