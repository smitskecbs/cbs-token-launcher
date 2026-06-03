import {
  MAINNET_RPC_NOT_CONFIGURED_MESSAGE,
  isMainnetRpcConfigured,
} from './config'

import { fetchTokenMetadata } from './fetchTokenMetadata'

import {
  fetchTokenMetadataJson,
  resolveMetadataImageUrl,
} from './fetchTokenMetadataJson'

import { parseMetadataCategoryValue } from '../utils/metadataCategory'
import {
  parseMetadataSocialFromJson,
  parseMetadataTags,
  type MetadataSocialLinks,
} from '../utils/metadataFields'

import {
  getTokenInfo,
  isValidMintAddress,
} from './getTokenInfo'

/** Result shown in the launch card verify panel */
export interface ReadTokenMintResult {
  mintAddress: string
  exists: boolean
  decimals: number | null
  supply: string | null
  metadataName: string | null
  metadataSymbol: string | null
  metadataUri: string | null
  metadataFound: boolean
  jsonName: string | null
  jsonSymbol: string | null
  jsonDescription: string | null
  jsonImage: string | null
  jsonExternalUrl: string | null
  jsonCategory: string | null
  jsonTags: string[]
  jsonSocialLinks: MetadataSocialLinks
  metadataJsonLoaded: boolean
  mintAuthority: string | null
  freezeAuthority: string | null
  error: string | null
}

const UI_MESSAGE = {
  INVALID_MINT: 'Invalid mint',
  MINT_NOT_FOUND: 'Mint not found',
  RPC_UNAVAILABLE: 'RPC unavailable',
} as const

export interface VerifyMintOptions {
  forceRefresh?: boolean
}

/**
 * Verify a launch mint for the UI.
 * Reads mint account, on-chain metadata, and off-chain JSON from the metadata URI.
 */
export async function verifyMint(
  mintAddress: string,
  options: VerifyMintOptions = {},
): Promise<ReadTokenMintResult> {
  const trimmed = mintAddress.trim()

  if (!isValidMintAddress(trimmed)) {
    return failure(trimmed, UI_MESSAGE.INVALID_MINT)
  }

  if (!isMainnetRpcConfigured()) {
    return failure(trimmed, UI_MESSAGE.RPC_UNAVAILABLE)
  }

  try {
    const tokenInfo = await getTokenInfo(trimmed, 'mainnet')
    const metadata = await fetchTokenMetadata(trimmed, 'mainnet')

    let json = null

    if (metadata?.uri) {
      json = await fetchTokenMetadataJson(metadata.uri, {
        forceRefresh: options.forceRefresh,
      })
    }

    const jsonImage =
      resolveMetadataImageUrl(json?.image) !== null
        ? (json?.image?.trim() ?? null)
        : null

    return {
      mintAddress: trimmed,
      exists: true,
      decimals: tokenInfo.decimals,
      supply: tokenInfo.supply,
      metadataName: metadata?.name ?? null,
      metadataSymbol: metadata?.symbol ?? null,
      metadataUri: metadata?.uri ?? null,
      metadataFound: metadata !== null,
      jsonName: json?.name?.trim() || null,
      jsonSymbol: json?.symbol?.trim() || null,
      jsonDescription: json?.description?.trim() || null,
      jsonImage,
      jsonExternalUrl: json?.external_url?.trim() || null,
      jsonCategory: parseMetadataCategoryValue(json?.category),
      jsonTags: parseMetadataTags(json?.tags),
      jsonSocialLinks: parseMetadataSocialFromJson(json),
      metadataJsonLoaded: json !== null,
      mintAuthority: tokenInfo.mintAuthority,
      freezeAuthority: tokenInfo.freezeAuthority,
      error: null,
    }
  } catch (cause) {
    if (
      cause instanceof Error &&
      cause.message === MAINNET_RPC_NOT_CONFIGURED_MESSAGE
    ) {
      return failure(trimmed, UI_MESSAGE.RPC_UNAVAILABLE)
    }

    if (
      cause instanceof Error &&
      (
        cause.message.includes('not found') ||
        cause.message.includes('Invalid token mint') ||
        cause.message.includes('not initialized')
      )
    ) {
      return mintNotFound(trimmed)
    }

    return failure(trimmed, UI_MESSAGE.RPC_UNAVAILABLE)
  }
}

/** @deprecated Use `verifyMint` — kept for existing imports */
export const readTokenMint = verifyMint

function emptyMetadataFields() {
  return {
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
    jsonTags: [] as string[],
    jsonSocialLinks: {} as MetadataSocialLinks,
    metadataJsonLoaded: false,
    mintAuthority: null,
    freezeAuthority: null,
  }
}

function mintNotFound(mintAddress: string): ReadTokenMintResult {
  return {
    mintAddress,
    exists: false,
    decimals: null,
    supply: null,
    ...emptyMetadataFields(),
    error: null,
  }
}

function failure(
  mintAddress: string,
  error: string,
): ReadTokenMintResult {
  return {
    mintAddress,
    exists: false,
    decimals: null,
    supply: null,
    ...emptyMetadataFields(),
    error,
  }
}
