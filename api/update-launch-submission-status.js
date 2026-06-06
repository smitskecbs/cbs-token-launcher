/**
 * Vercel serverless endpoint — update launch submission status.
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel env (never VITE_*).
 */
import { requireAdminAuth } from './lib/adminSession.js'
import { updateLaunchSubmissionStatus } from './lib/launchSubmissionsDb.js'

console.log('[update-launch-submission-status] handler loaded')

async function readRequestBody(req) {
  const chunks = []

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const raw = Buffer.concat(chunks).toString('utf8')

  if (!raw) {
    return null
  }

  return JSON.parse(raw)
}

export default async function handler(req, res) {
  console.log('[update-launch-submission-status] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdminAuth(req, res)) {
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    console.error('[update-launch-submission-status] Invalid request body')
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const result = await updateLaunchSubmissionStatus(
    process.env,
    body?.id,
    body?.status,
  )

  if (!result.ok) {
    console.error(
      `[update-launch-submission-status] Handler response status: ${result.status}`,
    )
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    id: result.id,
    status: result.statusValue,
  })
}
