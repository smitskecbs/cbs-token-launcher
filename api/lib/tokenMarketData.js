const DEXSCREENER_TOKEN_URL =
  'https://api.dexscreener.com/latest/dex/tokens'

const CACHE_TTL_MS = 30 * 60 * 1000
const LOG_PREFIX = '[token-market-data]'

const memoryCache = new Map()

function isValidMintAddress(value) {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function formatDexName(dexId) {
  return dexId
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function formatPairName(baseSymbol, quoteSymbol) {
  const base = trimString(baseSymbol)
  const quote = trimString(quoteSymbol)

  if (!base || !quote) {
    return null
  }

  return `${base} / ${quote}`
}

function parsePositiveNumber(value) {
  const parsed = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function pickBestSolanaPair(pairs) {
  let bestPair = null
  let bestLiquidity = 0

  for (const pair of pairs) {
    if (pair?.chainId !== 'solana') {
      continue
    }

    const liquidityUsd = pair?.liquidity?.usd ?? 0

    if (typeof liquidityUsd !== 'number' || liquidityUsd <= 0) {
      continue
    }

    if (liquidityUsd > bestLiquidity) {
      bestLiquidity = liquidityUsd
      bestPair = pair
    }
  }

  return bestPair
}

function emptyMarketData(mintAddress) {
  return {
    mintAddress,
    poolExists: false,
    dexName: null,
    pairAddress: null,
    pairName: null,
    pairUrl: null,
    liquidityUsd: null,
    priceUsd: null,
    volume24hUsd: null,
  }
}

function mapPairToMarketData(mintAddress, pair) {
  const liquidityUsd = parsePositiveNumber(pair?.liquidity?.usd)
  const priceUsd = parsePositiveNumber(pair?.priceUsd)
  const volume24hUsd = parsePositiveNumber(pair?.volume?.h24)
  const dexId = trimString(pair?.dexId)
  const pairAddress = trimString(pair?.pairAddress)

  return {
    mintAddress,
    poolExists: true,
    dexName: dexId ? formatDexName(dexId) : null,
    pairAddress: pairAddress || null,
    pairName: formatPairName(pair?.baseToken?.symbol, pair?.quoteToken?.symbol),
    pairUrl: trimString(pair?.url) || null,
    liquidityUsd,
    priceUsd,
    volume24hUsd,
  }
}

function readMemoryCache(mintAddress) {
  const entry = memoryCache.get(mintAddress)

  if (!entry) {
    return null
  }

  if (Date.now() - entry.cachedAt >= CACHE_TTL_MS) {
    memoryCache.delete(mintAddress)
    return null
  }

  return entry.data
}

function writeMemoryCache(mintAddress, data) {
  memoryCache.set(mintAddress, {
    data,
    cachedAt: Date.now(),
  })
}

async function fetchDexscreenerPairs(mintAddress) {
  const response = await fetch(`${DEXSCREENER_TOKEN_URL}/${mintAddress}`)

  if (!response.ok) {
    throw new Error(`Dexscreener HTTP ${response.status}`)
  }

  const payload = await response.json()

  if (!payload || !Array.isArray(payload.pairs)) {
    return []
  }

  return payload.pairs
}

export async function getTokenMarketData(mintAddress, options = {}) {
  const trimmedMint = trimString(mintAddress)

  if (!isValidMintAddress(trimmedMint)) {
    return {
      ok: false,
      status: 400,
      message: 'Mint address is invalid.',
    }
  }

  if (options.useCache !== false) {
    const cached = readMemoryCache(trimmedMint)

    if (cached) {
      return {
        ok: true,
        status: 200,
        data: cached,
        cached: true,
      }
    }
  }

  try {
    const pairs = await fetchDexscreenerPairs(trimmedMint)
    const bestPair = pickBestSolanaPair(pairs)
    const data = bestPair
      ? mapPairToMarketData(trimmedMint, bestPair)
      : emptyMarketData(trimmedMint)

    writeMemoryCache(trimmedMint, data)

    console.log(
      `${LOG_PREFIX} ${trimmedMint} poolExists=${data.poolExists} dex=${data.dexName ?? 'none'}`,
    )

    return {
      ok: true,
      status: 200,
      data,
      cached: false,
    }
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Dexscreener request failed:`,
      error instanceof Error ? error.message : 'unknown error',
    )

    return {
      ok: false,
      status: 502,
      message: 'Could not load market data right now. Please try again later.',
    }
  }
}
