import crypto from 'node:crypto'

export const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function getAdminPassword(env) {
  return trimString(env?.ADMIN_PASSWORD)
}

function safeEqualStrings(left, right) {
  const leftBuf = Buffer.from(left)
  const rightBuf = Buffer.from(right)

  if (leftBuf.length !== rightBuf.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuf, rightBuf)
}

export function verifyAdminPassword(inputPassword, adminPassword) {
  if (!inputPassword || !adminPassword) {
    return false
  }

  return safeEqualStrings(inputPassword, adminPassword)
}

export function createAdminSessionToken(adminPassword) {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS
  const nonce = crypto.randomBytes(12).toString('hex')
  const payload = `${expiresAt}.${nonce}`
  const signature = crypto
    .createHmac('sha256', adminPassword)
    .update(payload)
    .digest('base64url')

  return `${Buffer.from(payload, 'utf8').toString('base64url')}.${signature}`
}

export function verifyAdminSessionToken(token, adminPassword) {
  if (!token || !adminPassword) {
    return false
  }

  const parts = token.split('.')

  if (parts.length !== 2) {
    return false
  }

  let payload

  try {
    payload = Buffer.from(parts[0], 'base64url').toString('utf8')
  } catch {
    return false
  }

  const expiresAt = Number(payload.split('.')[0])

  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', adminPassword)
    .update(payload)
    .digest('base64url')

  return safeEqualStrings(parts[1], expectedSignature)
}

export function getBearerTokenFromHeaders(headers) {
  const header = headers?.authorization ?? headers?.Authorization

  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null
  }

  return header.slice('Bearer '.length).trim()
}

export function requireAdminAuth(req, res, env = process.env) {
  const adminPassword = getAdminPassword(env)

  if (!adminPassword) {
    console.error('[admin-auth] Missing env: ADMIN_PASSWORD')
    res.status(500).json({ error: 'Admin authentication is not configured.' })
    return false
  }

  const token = getBearerTokenFromHeaders(req.headers)

  if (!token || !verifyAdminSessionToken(token, adminPassword)) {
    res.status(401).json({ error: 'Admin authentication required.' })
    return false
  }

  return true
}
