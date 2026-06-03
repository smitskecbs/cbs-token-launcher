import type { EnrichedLaunch, Launch } from '../../types/launch'
import {
  verifyMint,
  type ReadTokenMintResult,
} from '../../solana/verifyMint'

/**
 * Enrich launch catalog entries with on-chain mint + metadata fields.
 *
 * JSON metadata (`fetchTokenMetadataJson`) will be wired here in a future phase.
 */
export async function enrichLaunchFromSolana(
  launch: Launch,
): Promise<EnrichedLaunch> {
  const mintResult = await verifyLaunchMint(launch.mintAddress)

  if (!mintResult.exists) {
    return { ...launch }
  }

  return {
    ...launch,
    decimals: mintResult.decimals ?? undefined,
    supply: mintResult.supply ?? undefined,
    metadataUri: mintResult.metadataUri ?? undefined,
    // Future Phase: fetchTokenMetadataJson(mintResult.metadataUri) → logo, description
  }
}

export async function verifyLaunchMint(
  mintAddress: string,
): Promise<ReadTokenMintResult> {
  return verifyMint(mintAddress)
}
