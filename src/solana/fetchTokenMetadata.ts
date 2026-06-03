import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'

import { publicKey } from '@metaplex-foundation/umi'

import {
  safeFetchMetadataFromSeeds,
} from '@metaplex-foundation/mpl-token-metadata'

import {
  getRpc,
  type SolanaNetwork,
} from './config'

/** On-chain Metaplex metadata fields read from the metadata account */
export interface OnChainTokenMetadata {
  name: string
  symbol: string
  uri: string
  updateAuthority: string | null
  isMutable: boolean
}

/**
 * Read the Metaplex metadata account for a verified mint.
 *
 * Uses the same RPC + Metaplex approach as CBS Token Builder
 * (`fetchTokenMetadataJson.ts`), without fetching off-chain JSON yet.
 */
export async function fetchTokenMetadata(
  mintAddress: string,
  network: SolanaNetwork = 'mainnet',
): Promise<OnChainTokenMetadata | null> {
  const trimmed = mintAddress.trim()
  const umi = createUmi(getRpc(network))

  const metadata = await safeFetchMetadataFromSeeds(umi, {
    mint: publicKey(trimmed),
  })

  if (!metadata) {
    return null
  }

  return {
    name: cleanMetadataString(metadata.name),
    symbol: cleanMetadataString(metadata.symbol),
    uri: cleanMetadataString(metadata.uri),
    updateAuthority: metadata.updateAuthority.toString(),
    isMutable: metadata.isMutable,
  }
}

/** Metaplex stores fixed-size strings — trim null padding */
function cleanMetadataString(value: string): string {
  return value.replace(/\0/g, '').trim()
}
