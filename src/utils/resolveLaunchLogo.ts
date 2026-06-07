import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { resolveMetadataImageUrl } from '../solana/fetchTokenMetadataJson'
import { getCachedMintVerification } from '../services/mintVerificationCache'

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

/** Admin or catalog-authored manual logo override. */
export function hasManualLaunchLogo(launch: Pick<Launch, 'logo'>): boolean {
  return hasText(launch.logo)
}

/**
 * Resolve the best logo URL for a launch.
 * Priority: manual logoUrl → metadata image → null (fallback icon).
 */
export function resolveLaunchLogoUrl(
  launch: Pick<Launch, 'logo' | 'mintAddress'>,
  mintResult?: ReadTokenMintResult | null,
): string | null {
  if (hasManualLaunchLogo(launch)) {
    return launch.logo!.trim()
  }

  const result =
    mintResult === undefined
      ? getCachedMintVerification(launch.mintAddress)
      : mintResult

  if (result?.jsonImage) {
    return resolveMetadataImageUrl(result.jsonImage)
  }

  return null
}

export function hasResolvableLaunchLogo(
  launch: Pick<Launch, 'logo' | 'mintAddress'>,
  mintResult?: ReadTokenMintResult | null,
): boolean {
  return resolveLaunchLogoUrl(launch, mintResult) !== null
}
