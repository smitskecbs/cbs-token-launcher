/** CBS ecosystem tool URLs */
export const CBS_URLS = {
  wallet: 'https://wallet.cbs-coin.com',
  tokenBuilder: 'https://token-builder.cbs-coin.com',
  tokenLauncher: 'https://token-launcher.cbs-coin.com',
} as const

/** External explorer links for token mint addresses */
export function getSolscanTokenUrl(mintAddress: string): string {
  return `https://solscan.io/token/${mintAddress}`
}

export function getDexscreenerPairUrl(pairAddress: string): string {
  return `https://dexscreener.com/solana/${pairAddress.trim()}`
}

export function getJupiterSwapUrl(mintAddress: string): string {
  return `https://jup.ag/swap/SOL-${mintAddress.trim()}`
}

export function getRaydiumPoolCreationUrl(): string {
  return 'https://raydium.io/liquidity/create-pool/'
}

export function getRaydiumSwapUrl(mintAddress: string): string {
  const mint = mintAddress.trim()

  return `https://raydium.io/swap/?inputMint=sol&outputMint=${mint}`
}
