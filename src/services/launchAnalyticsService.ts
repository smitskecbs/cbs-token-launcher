import type { ReadTokenMintResult } from '../solana/verifyMint'
import { resolveMetadataImageUrl } from '../solana/fetchTokenMetadataJson'
import type { MarketStatusResult } from '../types/marketStatus'
import { MARKET_STATUS } from '../types/marketStatus'
import type {
  LaunchAnalytics,
  LaunchAnalyticsCheck,
  LaunchAnalyticsSection,
} from '../types/launchAnalytics'

const METADATA_WEIGHT = 40
const SOCIAL_WEIGHT = 30
const MARKET_WEIGHT = 30

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function buildMetadataChecks(
  result: ReadTokenMintResult | null,
): LaunchAnalyticsSection {
  const checks: LaunchAnalyticsCheck[] = [
    {
      id: 'name',
      label: 'Name',
      passed:
        hasText(result?.jsonName) ||
        hasText(result?.metadataName),
    },
    {
      id: 'symbol',
      label: 'Symbol',
      passed:
        hasText(result?.jsonSymbol) ||
        hasText(result?.metadataSymbol),
    },
    {
      id: 'description',
      label: 'Description',
      passed: hasText(result?.jsonDescription),
    },
    {
      id: 'image',
      label: 'Image',
      passed: Boolean(
        resolveMetadataImageUrl(result?.jsonImage ?? undefined),
      ),
    },
  ]

  return sectionFromChecks(checks, 4)
}

function buildSocialChecks(
  result: ReadTokenMintResult | null,
): LaunchAnalyticsSection {
  const website = result?.metadataJsonLoaded
    ? result.jsonSocialLinks.website
    : result?.jsonExternalUrl ?? undefined
  const telegram = result?.metadataJsonLoaded
    ? result.jsonSocialLinks.telegram
    : undefined
  const twitter = result?.metadataJsonLoaded
    ? result.jsonSocialLinks.twitter
    : undefined

  const checks: LaunchAnalyticsCheck[] = [
    {
      id: 'website',
      label: 'Website',
      passed: hasText(website),
    },
    {
      id: 'telegram',
      label: 'Telegram',
      passed: hasText(telegram),
    },
    {
      id: 'twitter',
      label: 'X',
      passed: hasText(twitter),
    },
  ]

  return sectionFromChecks(checks, 3)
}

function isPoolFound(result: MarketStatusResult | null): boolean {
  if (!result) {
    return false
  }

  return (
    result.poolStatus === MARKET_STATUS.POOL_FOUND ||
    Boolean(result.pairName?.trim()) ||
    Boolean(result.pairUrl?.trim())
  )
}

function buildMarketChecks(
  result: MarketStatusResult | null,
): LaunchAnalyticsSection {
  const checks: LaunchAnalyticsCheck[] = [
    {
      id: 'pool',
      label: 'Pool found',
      passed: isPoolFound(result),
    },
    {
      id: 'tradable',
      label: 'Tradable',
      passed: Boolean(result?.tradable),
    },
  ]

  return sectionFromChecks(checks, 2)
}

function sectionFromChecks(
  checks: LaunchAnalyticsCheck[],
  total: number,
): LaunchAnalyticsSection {
  const passed = checks.filter((check) => check.passed).length

  return { passed, total, checks }
}

function sectionScore(
  section: LaunchAnalyticsSection,
  weight: number,
): number {
  if (section.total === 0) {
    return 0
  }

  return (section.passed / section.total) * weight
}

function computeLaunchScore(analytics: Omit<LaunchAnalytics, 'launchScore'>): number | null {
  if (!analytics.metadataLoaded && !analytics.marketLoaded) {
    return null
  }

  const score =
    sectionScore(analytics.metadata, METADATA_WEIGHT) +
    sectionScore(analytics.socials, SOCIAL_WEIGHT) +
    sectionScore(analytics.market, MARKET_WEIGHT)

  return Math.round(score)
}

export function computeLaunchAnalytics(
  mintResult: ReadTokenMintResult | null | undefined,
  marketResult: MarketStatusResult | null | undefined,
): LaunchAnalytics {
  const metadataLoaded = Boolean(
    mintResult?.exists && !mintResult.error,
  )
  const marketLoaded = Boolean(marketResult)

  const metadata = buildMetadataChecks(mintResult ?? null)
  const socials = buildSocialChecks(mintResult ?? null)
  const market = buildMarketChecks(marketResult ?? null)

  const base = {
    metadata,
    socials,
    market,
    metadataLoaded,
    marketLoaded,
  }

  return {
    ...base,
    launchScore: computeLaunchScore(base),
  }
}
