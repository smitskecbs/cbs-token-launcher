/**
 * Token mint lookup — Solana Kit port of CBS Token Builder `getTokenInfo.ts`.
 *
 * Uses the same RPC config (`getRpc`) and network selection pattern as Token Builder.
 * Token Builder uses web3.js Connection + spl-token getMint; this uses createSolanaRpc + fetchMaybeMint.
 */
import {
  address,
  createSolanaRpc,
  isAddress,
  isSome,
} from '@solana/kit'

import { fetchMaybeMint } from '@solana-program/token'

import {
  getRpc,
  type SolanaNetwork,
} from './config'

import { TOKEN_PROGRAM } from './tokenProgram'

export interface TokenInfo {
  supply: string
  formattedSupply: string
  decimals: number
  mintAuthority: string | null
  freezeAuthority: string | null
}

export function isValidMintAddress(
  mintAddress: string,
): boolean {
  const trimmed = mintAddress.trim()

  if (trimmed.length < 32) {
    return false
  }

  return isAddress(trimmed)
}

/**
 * Fetch on-chain token mint data for a mint address.
 * Mirrors CBS Token Builder `getTokenInfo(mintAddress, network)`.
 */
export async function getTokenInfo(
  mintAddress: string,
  network: SolanaNetwork = 'mainnet',
): Promise<TokenInfo> {
  const trimmed = mintAddress.trim()
  const rpc = createSolanaRpc(getRpc(network))

  const maybeMint = await fetchMaybeMint(
    rpc,
    address(trimmed),
  )

  if (!maybeMint.exists) {
    throw new Error('Mint account not found')
  }

  if (maybeMint.programAddress !== TOKEN_PROGRAM) {
    throw new Error('Invalid token mint account')
  }

  if (!maybeMint.data.isInitialized) {
    throw new Error('Mint account is not initialized')
  }

  const rawSupply = maybeMint.data.supply.toString()
  const formattedSupply =
    Number(maybeMint.data.supply) /
    10 ** maybeMint.data.decimals

  return {
    supply: rawSupply,
    formattedSupply: formattedSupply.toLocaleString(),
    decimals: maybeMint.data.decimals,
    mintAuthority: isSome(maybeMint.data.mintAuthority)
      ? maybeMint.data.mintAuthority.value
      : null,
    freezeAuthority: isSome(maybeMint.data.freezeAuthority)
      ? maybeMint.data.freezeAuthority.value
      : null,
  }
}
