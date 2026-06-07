import type { Launch } from '../types/launch'
import type { ReadTokenMintResult } from '../solana/verifyMint'
import { hasResolvableLaunchLogo } from './resolveLaunchLogo'

export type MetadataCheckState = 'success' | 'missing' | 'pending'

export interface MetadataStatusCheck {
  id: string
  successLabel: string
  missingLabel: string
  state: MetadataCheckState
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function resolveLogoFound(
  launch: Launch,
  result: ReadTokenMintResult | null,
): boolean {
  return hasResolvableLaunchLogo(launch, result)
}

function resolveNameFound(
  launch: Launch,
  result: ReadTokenMintResult | null,
): boolean {
  return hasText(
    result?.jsonName ??
      result?.metadataName ??
      launch.name,
  )
}

function resolveSymbolFound(
  launch: Launch,
  result: ReadTokenMintResult | null,
): boolean {
  return hasText(
    result?.jsonSymbol ??
      result?.metadataSymbol ??
      launch.symbol,
  )
}

function resolveDescriptionFound(
  launch: Launch,
  result: ReadTokenMintResult | null,
): boolean {
  const catalogDescription = launch.description?.trim()

  if (
    catalogDescription &&
    catalogDescription !== 'No project description provided yet.'
  ) {
    return true
  }

  return hasText(result?.jsonDescription)
}

function resolveMintVerified(
  result: ReadTokenMintResult | null,
  loading: boolean,
): MetadataCheckState {
  if (loading && !result) {
    return 'pending'
  }

  if (!result) {
    return 'missing'
  }

  if (result.error || !result.exists) {
    return 'missing'
  }

  return 'success'
}

export function buildMetadataStatusChecks(
  launch: Launch,
  result: ReadTokenMintResult | null,
  options: { loading?: boolean } = {},
): MetadataStatusCheck[] {
  const loading = options.loading === true

  const mintState = resolveMintVerified(result, loading)

  return [
    {
      id: 'logo',
      successLabel: 'Logo found',
      missingLabel: 'Logo missing',
      state: loading && !result && !hasText(launch.logo)
        ? 'pending'
        : resolveLogoFound(launch, result)
          ? 'success'
          : 'missing',
    },
    {
      id: 'name',
      successLabel: 'Name found',
      missingLabel: 'Name missing',
      state: loading && !result && !hasText(launch.name)
        ? 'pending'
        : resolveNameFound(launch, result)
          ? 'success'
          : 'missing',
    },
    {
      id: 'symbol',
      successLabel: 'Symbol found',
      missingLabel: 'Symbol missing',
      state: loading && !result && !hasText(launch.symbol)
        ? 'pending'
        : resolveSymbolFound(launch, result)
          ? 'success'
          : 'missing',
    },
    {
      id: 'mint',
      successLabel: 'Mint address verified',
      missingLabel: 'Mint address not verified',
      state: mintState,
    },
    {
      id: 'description',
      successLabel: 'Description found',
      missingLabel: 'Description missing',
      state: loading && !result && !resolveDescriptionFound(launch, null)
        ? 'pending'
        : resolveDescriptionFound(launch, result)
          ? 'success'
          : 'missing',
    },
  ]
}

export const METADATA_CHECK_COUNT = 5

export type MetadataStatusSummary =
  | { kind: 'pending' }
  | { kind: 'score'; passed: number; total: number }

export function getMetadataStatusSummary(
  launch: Launch,
  result: ReadTokenMintResult | null,
): MetadataStatusSummary {
  const checks = buildMetadataStatusChecks(launch, result, { loading: false })
  const passed = checks.filter((check) => check.state === 'success').length

  if (!result && passed === 0) {
    return { kind: 'pending' }
  }

  return {
    kind: 'score',
    passed,
    total: METADATA_CHECK_COUNT,
  }
}

export function formatMetadataSummaryLabel(
  summary: MetadataStatusSummary,
): string {
  if (summary.kind === 'pending') {
    return 'Metadata pending'
  }

  return `Metadata: ${summary.passed}/${summary.total}`
}

export function formatMetadataRefreshTimestamp(
  cachedAtMs: number | null,
): string | null {
  if (!cachedAtMs || cachedAtMs <= 0) {
    return null
  }

  const parsed = new Date(cachedAtMs)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
