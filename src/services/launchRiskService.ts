import type { ReadTokenMintResult } from '../solana/verifyMint'
import { resolveMetadataImageUrl } from '../solana/fetchTokenMetadataJson'
import type { MarketStatusResult } from '../types/marketStatus'
import { MARKET_STATUS } from '../types/marketStatus'
import type {
  LaunchRiskAssessment,
  LaunchRiskCheck,
  LaunchRiskLevel,
} from '../types/launchRisk'

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
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

function hasWebsite(result: ReadTokenMintResult | null): boolean {
  if (!result) {
    return false
  }

  if (result.metadataJsonLoaded) {
    return hasText(result.jsonSocialLinks.website)
  }

  return hasText(result.jsonExternalUrl)
}

function buildPositiveChecks(
  mintResult: ReadTokenMintResult | null,
  marketResult: MarketStatusResult | null,
): LaunchRiskCheck[] {
  const metadataPresent = Boolean(mintResult?.metadataFound)
  const imagePresent = Boolean(
    resolveMetadataImageUrl(mintResult?.jsonImage ?? undefined),
  )
  const mintVerified = Boolean(
    mintResult?.exists &&
      !mintResult.error &&
      mintResult.metadataFound,
  )

  return [
    {
      id: 'metadata',
      label: 'Metadata present',
      kind: 'positive',
      triggered: metadataPresent,
    },
    {
      id: 'image',
      label: 'Image present',
      kind: 'positive',
      triggered: imagePresent,
    },
    {
      id: 'website',
      label: 'Website present',
      kind: 'positive',
      triggered: hasWebsite(mintResult),
    },
    {
      id: 'mint-verified',
      label: 'Mint verified',
      kind: 'positive',
      triggered: mintVerified,
    },
    {
      id: 'liquidity-pool',
      label: 'Liquidity pool found',
      kind: 'positive',
      triggered: isPoolFound(marketResult),
    },
  ]
}

function buildWarningChecks(
  mintResult: ReadTokenMintResult | null,
): LaunchRiskCheck[] {
  return [
    {
      id: 'mint-authority',
      label: 'Mint authority active',
      kind: 'warning',
      triggered: hasText(mintResult?.mintAuthority),
    },
    {
      id: 'freeze-authority',
      label: 'Freeze authority active',
      kind: 'warning',
      triggered: hasText(mintResult?.freezeAuthority),
    },
  ]
}

function computeRiskLevel(
  positiveChecks: LaunchRiskCheck[],
  mintVerified: boolean,
): LaunchRiskLevel {
  const passed = positiveChecks.filter((check) => check.triggered).length

  if (!mintVerified || passed <= 2) {
    return 'HIGH'
  }

  if (passed <= 4) {
    return 'MEDIUM'
  }

  return 'LOW'
}

export function computeLaunchRisk(
  mintResult: ReadTokenMintResult | null | undefined,
  marketResult: MarketStatusResult | null | undefined,
): LaunchRiskAssessment {
  const loaded = Boolean(
    mintResult?.exists && !mintResult.error,
  )
  const positiveChecks = buildPositiveChecks(
    mintResult ?? null,
    marketResult ?? null,
  )
  const warningChecks = buildWarningChecks(mintResult ?? null)
  const mintVerified = positiveChecks.find(
    (check) => check.id === 'mint-verified',
  )?.triggered ?? false

  return {
    loaded,
    positiveChecks,
    warningChecks,
    riskLevel: loaded
      ? computeRiskLevel(positiveChecks, mintVerified)
      : null,
  }
}
