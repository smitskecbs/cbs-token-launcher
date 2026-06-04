import type { Launch } from '../types/launch'

export type {
  Launch,
  LaunchInfo,
  LaunchSection,
  LaunchStatus,
  OfficialLinks,
} from '../types/launch'

/**
 * Authoritative launch catalog for the CBS Token Launcher.
 *
 * Mint address, status, section, and launchInfo are required.
 * Token name, symbol, description, and logo load from metadata after Verify Mint
 * (or automatically when autoLoadMetadata is enabled).
 */
export const launches: Launch[] = [
  {
    id: 'cbs-coin',
    mintAddress: 'B9z8cEWFmc7LvQtjKsaLoKqW5MJmGRCWqs1DPKupCfkk',
    status: 'live',
    section: 'ecosystem',
    featured: true,
    createdAt: Date.parse('2024-01-01T00:00:00.000Z'),
    verificationLevel: 'cbs-verified',
    autoLoadMetadata: true,
    logoFallback: 'C',
    launchInfo: {
      launchStatus: 'Live',
      tradingStatus: 'Live',
      poolStatus: 'Liquidity pool active',
      launchDate: 'Live on Solana',
      officialLinks: {
        website: 'https://cbs-coin.com',
      },
    },
  },
  {
    id: 'mango',
    mintAddress: '29KN57rM6tV2aWdo1agZcF6ynPXB1dhHdKHNrrAmaNGo',
    status: 'preparing',
    section: 'upcoming',
    featured: true,
    createdAt: Date.parse('2025-01-15T00:00:00.000Z'),
    name: 'ManGo',
    symbol: 'MNGO',
    description:
      'ManGo is the first public example token created with CBS tools, but it is a separate meme project outside CBS Coin.',
    logoFallback: 'M',
    launchInfo: {
      launchStatus: 'Coming Soon',
      tradingStatus: 'Trading not live yet',
      poolStatus: 'Liquidity pool not created yet',
      launchDate: 'Official launch coming soon',
      officialLinks: {
        website: 'https://mangomeme.fun',
      },
    },
  },
]
