/**
 * Vercel serverless endpoint for launch submissions.
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel env (never VITE_*).
 *
 * Node.js version is controlled by the Vercel project (default nodejs24.x).
 * Do not use export const config.runtime here — that is Next.js-only and is ignored.
 */
import {
  insertSubmitLaunchRecord,
  validateSubmitLaunchPayload,
} from './lib/submitLaunchCore.js'
import { notifyAdminOfNewSubmission } from './lib/telegramNotify.js'

console.log('[submit-launch] handler loaded')

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
  console.log('[submit-launch] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    console.error('[submit-launch] Invalid request body')
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const validation = validateSubmitLaunchPayload(body)

  if (!validation.ok) {
    res.status(400).json({ error: validation.message })
    return
  }

  console.log('[submit-launch] validation passed')

  const result = await insertSubmitLaunchRecord(process.env, validation.data)

  if (!result.ok) {
    console.error(`[submit-launch] Handler response status: ${result.status}`)
    res.status(result.status).json({ error: result.message })
    return
  }

  await notifyAdminOfNewSubmission(process.env, validation.data)

  res.status(201).json({ ok: true })
}
