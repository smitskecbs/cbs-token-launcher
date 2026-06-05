/**
 * Vercel serverless endpoint for launch submissions.
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in Vercel env (never VITE_*).
 */
import {
  insertSubmitLaunchRecord,
  validateSubmitLaunchPayload,
} from './lib/submitLaunchCore.js'

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
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const validation = validateSubmitLaunchPayload(body)

  if (!validation.ok) {
    res.status(400).json({ error: validation.message })
    return
  }

  const result = await insertSubmitLaunchRecord(process.env, validation.data)

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(201).json({ ok: true })
}
