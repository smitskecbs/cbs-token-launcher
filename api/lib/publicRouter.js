import {
  getLaunchInterestCounts,
  incrementLaunchInterest,
} from './launchInterest.js'
import { listHomepageLaunches } from './launchSubmissionsDb.js'
import { listLaunchUpdates } from './launchUpdatesDb.js'
import { getTokenMarketData } from './tokenMarketData.js'
import { readRequestBody } from './readRequestBody.js'
import { resolveApiAction } from './resolveApiAction.js'

const LOG_PREFIX = '[public-api]'

export async function handlePublicApi(req, res, env = process.env) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const action = resolveApiAction(req, '/api/public')

  if (!action) {
    res.status(404).json({ error: 'Public action not found.' })
    return
  }

  console.log(`${LOG_PREFIX} action=${action} method=${req.method}`)

  switch (action) {
    case 'homepage-launches':
      return handleHomepageLaunches(req, res, env)
    case 'launch-interest':
      return handleLaunchInterest(req, res, env)
    case 'token-market-data':
      return handleTokenMarketData(req, res, env)
    case 'launch-updates':
      return handlePublicLaunchUpdates(req, res, env)
    default:
      res.status(404).json({ error: 'Public action not found.' })
  }
}

async function handleHomepageLaunches(req, res, env) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const result = await listHomepageLaunches(env)

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    count: result.count,
    launches: result.launches,
  })
}

async function handleLaunchInterest(req, res, env) {
  if (req.method === 'GET') {
    const mintParam =
      typeof req.query?.mints === 'string' ? req.query.mints.trim() : ''
    const mints = mintParam
      ? mintParam.split(',').map((mint) => mint.trim()).filter(Boolean)
      : []

    const result = await getLaunchInterestCounts(env, mints)

    if (!result.ok) {
      res.status(result.status).json({ error: result.message })
      return
    }

    res.status(200).json({
      ok: true,
      counts: result.counts,
    })
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

  const mintAddress =
    typeof body?.mintAddress === 'string' ? body.mintAddress.trim() : ''

  const result = await incrementLaunchInterest(env, mintAddress)

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    mintAddress: result.mintAddress,
    interestCount: result.interestCount,
  })
}

async function handleTokenMarketData(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const mint =
    typeof req.query?.mint === 'string' ? req.query.mint.trim() : ''

  const result = await getTokenMarketData(mint)

  if (!result.ok) {
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    cached: result.cached === true,
    data: result.data,
  })
}

async function handlePublicLaunchUpdates(req, res, env) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const submissionId =
    typeof req.query?.submissionId === 'string'
      ? req.query.submissionId.trim()
      : ''
  const launchId =
    typeof req.query?.launchId === 'string' ? req.query.launchId.trim() : ''

  const result = await listLaunchUpdates(env, {
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
}
