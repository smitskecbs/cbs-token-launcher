/**
 * Vercel serverless proxy for Solana mainnet JSON-RPC.
 * HELIUS_MAINNET_RPC must be set in Vercel Environment Variables (never VITE_*).
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const rpcUrl = process.env.HELIUS_MAINNET_RPC?.trim()

  if (!rpcUrl) {
    res.status(500).json({ error: 'Mainnet RPC is not configured.' })
    return
  }

  try {
    const chunks = []

    for await (const chunk of req) {
      chunks.push(chunk)
    }

    const body = Buffer.concat(chunks).toString('utf8')

    const upstream = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const responseText = await upstream.text()

    res
      .status(upstream.status)
      .setHeader('Content-Type', 'application/json')
      .send(responseText)
  } catch {
    res.status(502).json({ error: 'RPC upstream unavailable' })
  }
}
