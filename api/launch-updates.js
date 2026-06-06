/**
 * Launch updates timeline — public read, admin write.
 */
import { requireAdminAuth } from './lib/adminSession.js'
import {
  createLaunchUpdate,
  deleteLaunchUpdate,
  listLaunchUpdates,
} from './lib/launchUpdatesDb.js'

console.log('[launch-updates] handler loaded')

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
  console.log('[launch-updates] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
    const submissionId =
      typeof req.query?.submissionId === 'string'
        ? req.query.submissionId.trim()
        : ''
    const launchId =
      typeof req.query?.launchId === 'string' ? req.query.launchId.trim() : ''

    const result = await listLaunchUpdates(process.env, {
      submissionId,
      launchId,
    })

    if (!result.ok) {
      res.status(result.status).json({ error: result.message })
      return
    }

    res.status(200).json({
      ok: true,
      count: result.count,
      updates: result.updates,
    })
    return
  }

  if (req.method === 'POST') {
    if (!requireAdminAuth(req, res)) {
      return
    }

    let body

    try {
      body = await readRequestBody(req)
    } catch {
      res.status(400).json({ error: 'Invalid request body.' })
      return
    }

    const result = await createLaunchUpdate(process.env, body)

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
    if (!requireAdminAuth(req, res)) {
      return
    }

    let body

    try {
      body = await readRequestBody(req)
    } catch {
      res.status(400).json({ error: 'Invalid request body.' })
      return
    }

    const result = await deleteLaunchUpdate(process.env, body?.id)

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
