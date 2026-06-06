/**
 * Vercel serverless endpoint — admin password verification.
 * ADMIN_PASSWORD must be set in Vercel env (never VITE_*).
 */
import {
  ADMIN_SESSION_TTL_MS,
  createAdminSessionToken,
  getAdminPassword,
  verifyAdminPassword,
} from './lib/adminSession.js'

console.log('[admin-login] handler loaded')

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
  console.log('[admin-login] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const adminPassword = getAdminPassword(process.env)

  if (!adminPassword) {
    console.error('[admin-login] Missing env: ADMIN_PASSWORD')
    res.status(500).json({ error: 'Admin authentication is not configured.' })
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    console.error('[admin-login] Invalid request body')
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const password = typeof body?.password === 'string' ? body.password : ''

  if (!verifyAdminPassword(password, adminPassword)) {
    res.status(401).json({ error: 'Invalid admin password.' })
    return
  }

  const token = createAdminSessionToken(adminPassword)

  res.status(200).json({
    ok: true,
    token,
    expiresInMs: ADMIN_SESSION_TTL_MS,
  })
}
