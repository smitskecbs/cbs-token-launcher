/**
 * Vercel serverless endpoint — homepage launch catalog from Supabase.
 * Returns only coming_soon and live submissions (pending/rejected hidden).
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel env (never VITE_*).
 */
import { listHomepageLaunches } from './lib/launchSubmissionsDb.js'

console.log('[homepage-launches] handler loaded')

export default async function handler(req, res) {
  console.log('[homepage-launches] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const result = await listHomepageLaunches(process.env)

  if (!result.ok) {
    console.error(
      `[homepage-launches] Handler response status: ${result.status}`,
    )
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    count: result.count,
    launches: result.launches,
  })
}
