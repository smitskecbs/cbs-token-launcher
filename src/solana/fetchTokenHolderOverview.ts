import {
  address,
  createSolanaRpc,
  isAddress,
} from '@solana/kit'

import type { Base58EncodedBytes } from '@solana/rpc-types'

import type { HolderOverviewResult } from '../types/holderOverview'
import {
  getRpc,
  isMainnetRpcConfigured,
  MAINNET_RPC_NOT_CONFIGURED_MESSAGE,
  type SolanaNetwork,
} from './config'
import { getTokenInfo } from './getTokenInfo'
import { TOKEN_PROGRAM } from './tokenProgram'

interface ParsedTokenAccountInfo {
  tokenAmount?: {
    amount?: string
  }
}

interface ParsedTokenAccountData {
  parsed?: {
    info?: ParsedTokenAccountInfo
  }
}

interface ProgramAccountEntry {
  account?: {
    data?: ParsedTokenAccountData
  }
}

function percentOfSupply(
  holderAmount: bigint,
  totalSupply: bigint,
): number | null {
  if (totalSupply <= 0n) {
    return null
  }

  const basisPoints = (holderAmount * 10000n) / totalSupply

  return Number(basisPoints) / 100
}

function sumBalances(balances: bigint[]): bigint {
  return balances.reduce((total, balance) => total + balance, 0n)
}

function readTokenAccountAmount(account: unknown): bigint | null {
  if (!account || typeof account !== 'object') {
    return null
  }

  const amount = (account as ProgramAccountEntry).account?.data?.parsed?.info
    ?.tokenAmount?.amount

  if (typeof amount !== 'string' || !/^\d+$/.test(amount)) {
    return null
  }

  try {
    return BigInt(amount)
  } catch {
    return null
  }
}

async function fetchHolderCount(
  rpc: ReturnType<typeof createSolanaRpc>,
  mintAddress: string,
): Promise<number | null> {
  try {
    const accounts = await rpc
      .getProgramAccounts(TOKEN_PROGRAM, {
        encoding: 'jsonParsed',
        withContext: false,
        filters: [
          { dataSize: 165n },
          {
            memcmp: {
              offset: 0n,
              bytes: mintAddress as Base58EncodedBytes,
              encoding: 'base58',
            },
          },
        ],
      })
      .send()

    let holderCount = 0

    for (const account of accounts) {
      const amount = readTokenAccountAmount(account)

      if (amount !== null && amount > 0n) {
        holderCount += 1
      }
    }

    return holderCount
  } catch {
    return null
  }
}

async function fetchLargestAccountBalances(
  rpc: ReturnType<typeof createSolanaRpc>,
  mintAddress: string,
): Promise<bigint[] | null> {
  try {
    const { value: largestAccounts } = await rpc
      .getTokenLargestAccounts(address(mintAddress))
      .send()

    const balances: bigint[] = []

    for (const account of largestAccounts) {
      try {
        balances.push(BigInt(account.amount))
      } catch {
        return null
      }
    }

    return balances
  } catch {
    return null
  }
}

/**
 * Read holder distribution from Solana RPC.
 * Uses getProgramAccounts for holder count and getTokenLargestAccounts for concentration.
 */
export async function fetchTokenHolderOverview(
  mintAddress: string,
  network: SolanaNetwork = 'mainnet',
): Promise<HolderOverviewResult> {
  const trimmed = mintAddress.trim()

  if (!isAddress(trimmed)) {
    return unavailableResult(trimmed, 'Invalid mint address')
  }

  if (network === 'mainnet' && !isMainnetRpcConfigured()) {
    return unavailableResult(trimmed, MAINNET_RPC_NOT_CONFIGURED_MESSAGE)
  }

  try {
    const rpc = createSolanaRpc(getRpc(network))
    const tokenInfo = await getTokenInfo(trimmed, network)
    const totalSupply = BigInt(tokenInfo.supply)

    const [holderCount, largestBalances] = await Promise.all([
      fetchHolderCount(rpc, trimmed),
      fetchLargestAccountBalances(rpc, trimmed),
    ])

    if (!largestBalances || largestBalances.length === 0) {
      return {
        mintAddress: trimmed,
        holderCount,
        largestHolderPercent:
          largestBalances === null ? null : 0,
        top10HoldersPercent:
          largestBalances === null ? null : 0,
        top20HoldersPercent:
          largestBalances === null ? null : 0,
        error:
          largestBalances === null
            ? 'Unable to fetch largest holder accounts'
            : null,
      }
    }

    const largestHolderPercent = percentOfSupply(
      largestBalances[0] ?? 0n,
      totalSupply,
    )
    const top10HoldersPercent = percentOfSupply(
      sumBalances(largestBalances.slice(0, 10)),
      totalSupply,
    )
    const top20HoldersPercent = percentOfSupply(
      sumBalances(largestBalances),
      totalSupply,
    )

    return {
      mintAddress: trimmed,
      holderCount,
      largestHolderPercent,
      top10HoldersPercent,
      top20HoldersPercent,
      error: null,
    }
  } catch (cause) {
    const message =
      cause instanceof Error ? cause.message : 'Unable to fetch holder data'

    return unavailableResult(trimmed, message)
  }
}

function unavailableResult(
  mintAddress: string,
  error: string,
): HolderOverviewResult {
  return {
    mintAddress,
    holderCount: null,
    largestHolderPercent: null,
    top10HoldersPercent: null,
    top20HoldersPercent: null,
    error,
  }
}
