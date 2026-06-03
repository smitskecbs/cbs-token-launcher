import { CBS_URLS } from '../config/urls'
import type { CbsTool } from '../types/tool'
import tokenBuilderLogo from '../assets/tools/token-builder.png'
import tokenLauncherLogo from '../assets/logo.png'
import walletGeneratorLogo from '../assets/tools/wallet-generator.png'

/** CBS ecosystem tools shown in the Tools section */
export const cbsTools: CbsTool[] = [
  {
    id: 'wallet',
    name: 'Wallet Generator',
    description: 'Create a Solana wallet for your CBS projects.',
    url: CBS_URLS.wallet,
    iconFallback: 'W',
    logoUrl: walletGeneratorLogo,
  },
  {
    id: 'token-builder',
    name: 'Token Builder',
    description: 'Launch your own Solana token with no platform fees.',
    url: CBS_URLS.tokenBuilder,
    iconFallback: 'TB',
    logoUrl: tokenBuilderLogo,
  },
  {
    id: 'token-launcher',
    name: 'Token Launcher',
    description: 'Browse featured and upcoming CBS token launches.',
    url: CBS_URLS.tokenLauncher,
    iconFallback: 'L',
    logoUrl: tokenLauncherLogo,
    isCurrent: true,
  },
]
