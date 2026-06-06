/**
 * Public launch interest endpoint — increment or read community votes.
 */
import {
  getLaunchInterestCounts,
  incrementLaunchInterest,
} from './lib/launchInterest.js'

console.log('[launch-interest] handler loaded')

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
  console.log('[launch-interest] request received', req.method)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method === 'GET') {
    const mintParam =
      typeof req.query?.mints === 'string' ? req.query.mints.trim() : ''
    const mints = mintParam
      ? mintParam.split(',').map((mint) => mint.trim()).filter(Boolean)
      : []

    const result = await getLaunchInterestCounts(process.env, mints)

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
    console.error('[launch-interest] Invalid request body')
    res.status(400).json({ error: 'Invalid request body.' })
    return
  }

  const mintAddress =
    typeof body?.mintAddress === 'string' ? body.mintAddress.trim() : ''

  const result = await incrementLaunchInterest(process.env, mintAddress)

  if (!result.ok) {
    console.error(`[launch-interest] Handler response status: ${result.status}`)
    res.status(result.status).json({ error: result.message })
    return
  }

  res.status(200).json({
    ok: true,
    mintAddress: result.mintAddress,
    interestCount: result.interestCount,
  })
}
