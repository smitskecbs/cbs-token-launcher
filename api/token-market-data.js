/**
 * Vercel serverless endpoint — read-only token market data via Dexscreener.
 * No secrets required; responses are cached server-side to reduce upstream calls.
 */
import { getTokenMarketData } from './lib/tokenMarketData.js'

console.log('[token-market-data] handler loaded')

export default async function handler(req, res) {
  console.log('[token-market-data] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const mint =
    typeof req.query?.mint === 'string' ? req.query.mint.trim() : ''

  const result = await getTokenMarketData(mint)

  if (!result.ok) {
    console.error(`[token-market-data] Handler response status: ${result.status}`)
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    cached: result.cached === true,
    data: result.data,
  })
}
