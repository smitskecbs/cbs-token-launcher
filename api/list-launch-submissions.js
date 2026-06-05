/**
 * Vercel serverless endpoint — read-only launch submission list.
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel env (never VITE_*).
 */
import { listLaunchSubmissions } from './lib/launchSubmissionsDb.js'

console.log('[list-launch-submissions] handler loaded')

export default async function handler(req, res) {
  console.log('[list-launch-submissions] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const result = await listLaunchSubmissions(process.env)

  if (!result.ok) {
    console.error(
      `[list-launch-submissions] Handler response status: ${result.status}`,
    )
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    count: result.count,
    submissions: result.submissions,
  })
}
