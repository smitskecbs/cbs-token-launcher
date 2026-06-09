/** CBS ecosystem tool URLs */
export const CBS_URLS = {
  wallet: 'https://wallet.cbs-coin.com',
  tokenBuilder: 'https://token-builder.cbs-coin.com',
  tokenLauncher: 'https://token-launcher.cbs-coin.com',
} as const

/** External explorer links for token mint addresses */
export function getSolscanTokenUrl(mintAddress: string): string {
  return `https://solscan.io/token/${mintAddress.trim()}`
}

export function getSolanaExplorerAddressUrl(mintAddress: string): string {
  return `https://explorer.solana.com/address/${mintAddress.trim()}`
}

export function getOrbAddressUrl(mintAddress: string): string {
  return `https://orb.helius.dev/address/${mintAddress.trim()}`
}

export function getDexscreenerPairUrl(pairAddress: string): string {
  return `https://dexscreener.com/solana/${pairAddress.trim()}`
}

export function getDexscreenerTokenUrl(mintAddress: string): string {
  return `https://dexscreener.com/solana/${mintAddress.trim()}`
}

export function getDexscreenerChartEmbedUrl(pairAddress: string): string {
  const pair = pairAddress.trim()
  const params = new URLSearchParams({
    embed: '1',
    loadChartSettings: '0',
    chartLeftToolbar: '0',
    chartTheme: 'light',
    chartDefaultOnMobile: '1',
    trades: '0',
    info: '0',
  })

  return `https://dexscreener.com/solana/${pair}?${params.toString()}`
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

export function getRaydiumAddLiquidityUrl(mintAddress: string): string {
  const mint = mintAddress.trim()

  return `https://raydium.io/liquidity/increase/?inputMint=sol&outputMint=${mint}`
}
