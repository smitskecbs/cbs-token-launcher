import {
  ADMIN_SESSION_TTL_MS,
  createAdminSessionToken,
  getAdminPassword,
  requireAdminAuth,
  verifyAdminPassword,
} from './adminSession.js'
import {
  deleteLaunchSubmission,
  listLaunchSubmissions,
  updateLaunchSubmissionDetails,
  updateLaunchSubmissionFeatured,
  updateLaunchSubmissionStatus,
  updateLaunchSubmissionVerified,
} from './launchSubmissionsDb.js'
import {
  createLaunchUpdate,
  deleteLaunchUpdate,
} from './launchUpdatesDb.js'
import { validateAdminEditSubmissionPayload } from './submitLaunchCore.js'
import { readRequestBody } from './readRequestBody.js'
import { resolveApiAction } from './resolveApiAction.js'

const LOG_PREFIX = '[admin-api]'

export async function handleAdminApi(req, res, env = process.env) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const action = resolveApiAction(req, '/api/admin')

  if (!action) {
    res.status(404).json({ error: 'Admin action not found.' })
    return
  }

  console.log(`${LOG_PREFIX} action=${action} method=${req.method}`)

  switch (action) {
    case 'login':
      return handleAdminLogin(req, res, env)
    case 'list-launch-submissions':
      return handleListLaunchSubmissions(req, res, env)
    case 'update-launch-submission-status':
      return handleUpdateLaunchSubmissionStatus(req, res, env)
    case 'update-launch-submission-details':
      return handleUpdateLaunchSubmissionDetails(req, res, env)
    case 'update-launch-submission-featured':
      return handleUpdateLaunchSubmissionFeatured(req, res, env)
    case 'update-launch-submission-verified':
      return handleUpdateLaunchSubmissionVerified(req, res, env)
    case 'delete-launch-submission':
      return handleDeleteLaunchSubmission(req, res, env)
    case 'launch-updates':
      return handleAdminLaunchUpdates(req, res, env)
    default:
      res.status(404).json({ error: 'Admin action not found.' })
  }
}

async function handleAdminLogin(req, res, env) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const adminPassword = getAdminPassword(env)

  if (!adminPassword) {
    console.error(`${LOG_PREFIX} Missing env: ADMIN_PASSWORD`)
    res.status(500).json({ error: 'Admin authentication is not configured.' })
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
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

async function handleListLaunchSubmissions(req, res, env) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdminAuth(req, res, env)) {
    return
  }

  const result = await listLaunchSubmissions(env)

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    count: result.count,
    submissions: result.submissions,
  })
}

async function handleUpdateLaunchSubmissionStatus(req, res, env) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdminAuth(req, res, env)) {
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const result = await updateLaunchSubmissionStatus(
    env,
    body?.id,
    body?.status,
  )

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    id: result.id,
    status: result.statusValue,
  })
}

async function handleUpdateLaunchSubmissionDetails(req, res, env) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdminAuth(req, res, env)) {
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const submissionId = typeof body?.id === 'string' ? body.id.trim() : ''

  if (!submissionId) {
    res.status(400).json({ error: 'Submission id is required.' })
    return
  }

  const validation = validateAdminEditSubmissionPayload(body)

  if (!validation.ok) {
    res.status(400).json({ error: validation.message })
    return
  }

  const result = await updateLaunchSubmissionDetails(
    env,
    submissionId,
    validation.data,
  )

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    id: result.id,
  })
}

async function handleUpdateLaunchSubmissionFeatured(req, res, env) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdminAuth(req, res, env)) {
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const result = await updateLaunchSubmissionFeatured(
    env,
    body?.id,
    body?.featured,
  )

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    id: result.id,
    featured: result.featured,
  })
}

async function handleUpdateLaunchSubmissionVerified(req, res, env) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdminAuth(req, res, env)) {
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const result = await updateLaunchSubmissionVerified(
    env,
    body?.id,
    body?.verified,
  )

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    id: result.id,
    verified: result.verified,
  })
}

async function handleDeleteLaunchSubmission(req, res, env) {
  if (req.method !== 'DELETE') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!requireAdminAuth(req, res, env)) {
    return
  }

  let body

  try {
    body = await readRequestBody(req)
  } catch {
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const result = await deleteLaunchSubmission(env, body?.id)

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    id: result.id,
  })
}

async function handleAdminLaunchUpdates(req, res, env) {
  if (req.method === 'POST') {
    if (!requireAdminAuth(req, res, env)) {
      return
    }

    let body

    try {
      body = await readRequestBody(req)
    } catch {
      res.status(400).json({ error: 'Invalid request body.' })
      return
    }

    const result = await createLaunchUpdate(env, body)

    if (!result.ok) {
      res.status(result.status).json({ error: result.message })
      return
    }

    res.status(201).json({
      ok: true,
      update: result.update,
    })
    return
  }

  if (req.method === 'DELETE') {
    if (!requireAdminAuth(req, res, env)) {
      return
    }

    let body

    try {
      body = await readRequestBody(req)
    } catch {
      res.status(400).json({ error: 'Invalid request body.' })
      return
    }

    const result = await deleteLaunchUpdate(env, body?.id)

    if (!result.ok) {
      res.status(result.status).json({ error: result.message })
      return
    }

    res.status(200).json({
      ok: true,
      id: result.id,
    })
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
