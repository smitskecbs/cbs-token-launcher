import { defineConfig, loadEnv, type Plugin } from 'vite'

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
    base: './',
    plugins: [rpcProxyPlugin(env.HELIUS_MAINNET_RPC?.trim())],
  }
})
