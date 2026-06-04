/**
 * Solana RPC configuration for CBS Token Launcher.
 *
 * SECURITY: Mainnet RPC uses the server-side `/api/rpc` proxy on Vercel.
 * Never put Helius API keys or other secrets in `VITE_*` variables.
 * Devnet may use a public RPC URL in the browser.
 */
export type SolanaNetwork =
  | 'devnet'
  | 'mainnet'

const SOLSCAN_ORIGIN =
  'https://solscan.io'

const DEVNET_RPC_FALLBACK =
  'https://api.devnet.solana.com'

/** Browser-facing mainnet JSON-RPC path (proxied by api/rpc on Vercel). */
export const MAINNET_RPC_PROXY_PATH = '/api/rpc'

function trimEnv(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed || undefined
}

const HELIUS_DEVNET_RPC =
  trimEnv(import.meta.env.VITE_HELIUS_DEVNET_RPC) ??
  DEVNET_RPC_FALLBACK

export const MAINNET_RPC_NOT_CONFIGURED_MESSAGE =
  'Mainnet RPC is not configured.'

function resolveMainnetRpcUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${MAINNET_RPC_PROXY_PATH}`
  }

  return MAINNET_RPC_PROXY_PATH
}

/** Mainnet uses the Vercel proxy; devnet uses a public or env-configured URL. */
export function isMainnetRpcConfigured(): boolean {
  return true
}

export const SOLANA_NETWORKS: Record<
  SolanaNetwork,
  {
    rpc: string
    explorer: string
  }
> = {
  devnet: {
    rpc: HELIUS_DEVNET_RPC,
    explorer: SOLSCAN_ORIGIN,
  },

  mainnet: {
    rpc: resolveMainnetRpcUrl(),
    explorer: SOLSCAN_ORIGIN,
  },
}

export function getRpc(
  network: SolanaNetwork,
): string {
  if (network === 'mainnet') {
    return resolveMainnetRpcUrl()
  }

  return HELIUS_DEVNET_RPC
}

export function getExplorerTokenUrl(
  network: SolanaNetwork,
  mintAddress: string,
): string {
  const url = `${SOLSCAN_ORIGIN}/token/${mintAddress}`

  if (network === 'devnet') {
    return `${url}?cluster=devnet`
  }

  return url
}
