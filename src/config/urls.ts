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
