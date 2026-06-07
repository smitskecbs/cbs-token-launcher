import type { Launch } from '../types/launch'
import { verifyMint } from '../solana/verifyMint'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import {
  clearCachedMintVerification,
  getCachedMintVerification,
  setCachedMintVerification,
} from './mintVerificationCache'
import { hasManualLaunchLogo } from '../utils/resolveLaunchLogo'

export interface LoadMintVerificationOptions {
  forceRefresh?: boolean
}

const RPC_UNAVAILABLE_RESULT = (
  mintAddress: string,
): ReadTokenMintResult => ({
  mintAddress,
  exists: false,
  decimals: null,
  supply: null,
  metadataName: null,
  metadataSymbol: null,
  metadataUri: null,
  metadataFound: false,
  jsonName: null,
  jsonSymbol: null,
  jsonDescription: null,
  jsonImage: null,
  jsonExternalUrl: null,
  jsonCategory: null,
  jsonTags: [],
  jsonSocialLinks: {},
  metadataJsonLoaded: false,
  mintAuthority: null,
  freezeAuthority: null,
  error: 'RPC unavailable',
})

/** Load mint verification from cache or RPC */
export async function loadMintVerification(
  mintAddress: string,
  options: LoadMintVerificationOptions = {},
): Promise<ReadTokenMintResult> {
  if (!options.forceRefresh) {
    const cached = getCachedMintVerification(mintAddress)

    if (cached) {
      return cached
    }
  } else {
    clearCachedMintVerification(mintAddress)
  }

  try {
    const result = await verifyMint(mintAddress, {
      forceRefresh: options.forceRefresh,
    })
    setCachedMintVerification(mintAddress, result)
    return result
  } catch {
    const result = RPC_UNAVAILABLE_RESULT(mintAddress)
    setCachedMintVerification(mintAddress, result)
    return result
  }
}

export function shouldAutoLoadMetadata(launch: Launch): boolean {
  if (hasManualLaunchLogo(launch)) {
    return false
  }

  if (launch.autoLoadMetadata === true) {
    return true
  }

  return Boolean(launch.mintAddress.trim())
}
