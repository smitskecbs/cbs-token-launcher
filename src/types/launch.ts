/**
 * Launch lifecycle status for the CBS Token Launcher pad.
 */
export type LaunchStatus = 'preparing' | 'live' | 'ended'

/** Homepage section placement for a catalog entry */
export type LaunchSection = 'featured' | 'ecosystem' | 'upcoming'

/**
 * Admin verification level — separate from automatic on-chain ✓ VERIFIED checks.
 * - normal: no admin badge; ✓ VERIFIED shown only when on-chain checks pass
 * - verified: admin-approved ✓ VERIFIED
 * - cbs-verified: CBS-approved ⭐ CBS VERIFIED
 */
export type LaunchVerificationLevel =
  | 'normal'
  | 'verified'
  | 'cbs-verified'

/** Optional official links authored in the launch catalog (fallback only) */
export interface OfficialLinks {
  website?: string
  telegram?: string
  twitter?: string
  discord?: string
  facebook?: string
  github?: string
}

/**
 * Launch-specific information — separate from on-chain token metadata.
 */
export interface LaunchInfo {
  launchStatus: string
  tradingStatus: string
  poolStatus: string
  launchDate: string
  officialLinks?: OfficialLinks
}

/**
 * Launch catalog entry — mint address and status are required.
 *
 * Name, symbol, description, and logo are loaded from on-chain metadata
 * after Verify Mint (or from cache). Optional fields are static overrides.
 */
export interface Launch {
  id: string
  mintAddress: string
  status: LaunchStatus
  section: LaunchSection
  /** Highlight in the Featured Launches homepage section */
  featured?: boolean
  /** Catalog creation time (Unix ms) for built-in launches */
  createdAt?: number
  /** Load token metadata from mint on page load (uses cache when available) */
  autoLoadMetadata?: boolean
  launchInfo: LaunchInfo
  name?: string
  symbol?: string
  description?: string
  logo?: string
  /** Shown when no metadata image is available (e.g. emoji) */
  logoFallback?: string
  /** Submitted via Submit Launch and stored in localStorage */
  locallyManaged?: boolean
  /** Unix ms when the launch was submitted locally (used for section sorting) */
  submittedAt?: number
  /** Admin verification level (localStorage or built-in catalog) */
  verificationLevel?: LaunchVerificationLevel
}

/**
 * Optional on-chain and market fields for future enrichment layers.
 */
export interface LaunchEnrichment {
  metadataUri?: string
  decimals?: number
  supply?: string
  /** Resolved from metadata JSON `category` field */
  category?: string
  priceUsd?: number
  liquidityUsd?: number
  marketCapUsd?: number
  volume24hUsd?: number
}

export type EnrichedLaunch = Launch & LaunchEnrichment

export const LAUNCH_CARD_PLACEHOLDER = {
  name: 'Token',
  symbol: '—',
  description:
    'Verify mint to load token name, symbol, description, and logo from on-chain metadata.',
} as const

export const LAUNCH_CARD_AUTO_LOAD_PLACEHOLDER = {
  name: 'Token',
  symbol: '—',
  description:
    'Loading token name, symbol, description, and logo from on-chain metadata…',
} as const
