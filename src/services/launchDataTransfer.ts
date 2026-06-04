import { launches } from '../data/launches'
import type {
  SubmittedLaunchRecord,
} from './submittedLaunchesStorage'
import {
  createSubmittedLaunchId,
  getSubmittedLaunchRecords,
  setSubmittedLaunchRecords,
} from './submittedLaunchesStorage'
import type {
  ExportedLaunch,
  ExportedLaunchesFile,
  LaunchImportResult,
} from '../types/exportedLaunch'
import type { LaunchVerificationLevel } from '../types/launch'
import { isValidMintAddress } from '../solana/getTokenInfo'
import {
  isValidLaunchDate,
  isValidLaunchSection,
  isValidLaunchStatus,
  isValidVerificationLevel,
  validateEditableLaunchFields,
} from '../utils/launchValidation'

const EXPORT_FILENAME = 'cbs-launches.json'

function getBuiltInMintAddresses(): Set<string> {
  return new Set(
    launches.map((launch) => launch.mintAddress.trim()),
  )
}

export function buildExportedLaunchesFile(): ExportedLaunchesFile {
  return {
    version: 1,
    exportedAt: Date.now(),
    launches: getSubmittedLaunchRecords().map(recordToExport),
  }
}

function recordToExport(record: SubmittedLaunchRecord): ExportedLaunch {
  return {
    mintAddress: record.mintAddress.trim(),
    launchStatus: record.status,
    launchSection: record.section,
    launchDate: record.launchDate.trim(),
    createdAt: record.submittedAt,
    updatedAt: record.updatedAt ?? record.submittedAt,
    featured: record.featured === true,
    verificationLevel: record.verificationLevel ?? 'normal',
  }
}

export function downloadExportedLaunches(): boolean {
  const records = getSubmittedLaunchRecords()

  if (records.length === 0) {
    return false
  }

  const json = `${JSON.stringify(buildExportedLaunchesFile(), null, 2)}\n`
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = EXPORT_FILENAME
  link.click()
  URL.revokeObjectURL(url)
  return true
}

function parseImportedLaunch(value: unknown): ExportedLaunch | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const entry = value as Record<string, unknown>
  const mintAddress =
    typeof entry.mintAddress === 'string'
      ? entry.mintAddress.trim()
      : ''
  const launchStatus = (
    entry.launchStatus ??
    entry.status ??
    ''
  ).toString()
  const launchSection = (
    entry.launchSection ??
    entry.section ??
    ''
  ).toString()
  const launchDate =
    typeof entry.launchDate === 'string'
      ? entry.launchDate.trim()
      : ''
  const createdAt =
    typeof entry.createdAt === 'number'
      ? entry.createdAt
      : typeof entry.submittedAt === 'number'
        ? entry.submittedAt
        : NaN
  const updatedAt =
    typeof entry.updatedAt === 'number'
      ? entry.updatedAt
      : createdAt
  const verificationLevelRaw =
    typeof entry.verificationLevel === 'string'
      ? entry.verificationLevel
      : 'normal'

  if (
    !mintAddress ||
    !isValidMintAddress(mintAddress) ||
    Number.isNaN(createdAt)
  ) {
    return null
  }

  const validation = validateEditableLaunchFields({
    status: launchStatus,
    section: launchSection,
    launchDate,
    verificationLevel: verificationLevelRaw,
  })

  if (
    !validation.valid ||
    !isValidLaunchStatus(launchStatus) ||
    !isValidLaunchSection(launchSection) ||
    !isValidLaunchDate(launchDate) ||
    !isValidVerificationLevel(verificationLevelRaw)
  ) {
    return null
  }

  return {
    mintAddress,
    launchStatus,
    launchSection,
    launchDate,
    createdAt,
    updatedAt,
    featured: entry.featured === true,
    verificationLevel: verificationLevelRaw as LaunchVerificationLevel,
  }
}

function parseExportedLaunchesFile(raw: unknown): ExportedLaunch[] | null {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  const payload = raw as Partial<ExportedLaunchesFile>
  const entries = Array.isArray(payload.launches)
    ? payload.launches
    : Array.isArray(raw)
      ? raw
      : null

  if (!entries) {
    return null
  }

  return entries
    .map(parseImportedLaunch)
    .filter((entry): entry is ExportedLaunch => entry !== null)
}

function dedupeExportedLaunches(
  items: ExportedLaunch[],
): ExportedLaunch[] {
  const byMint = new Map<string, ExportedLaunch>()

  for (const item of items) {
    const mintKey = item.mintAddress.trim()
    const existing = byMint.get(mintKey)

    if (!existing || item.updatedAt >= existing.updatedAt) {
      byMint.set(mintKey, item)
    }
  }

  return [...byMint.values()]
}

function exportToSubmittedRecord(
  item: ExportedLaunch,
): SubmittedLaunchRecord {
  return {
    id: createSubmittedLaunchId(item.mintAddress),
    mintAddress: item.mintAddress.trim(),
    status: item.launchStatus,
    section: item.launchSection,
    launchDate: item.launchDate.trim(),
    submittedAt: item.createdAt,
    updatedAt: item.updatedAt,
    tokenName: null,
    tokenSymbol: null,
    featured: item.featured === true,
    verificationLevel: item.verificationLevel ?? 'normal',
  }
}

function recordTimestamp(record: SubmittedLaunchRecord): number {
  return record.updatedAt ?? record.submittedAt
}

export function importLaunchesFromJson(raw: unknown): LaunchImportResult {
  const parsed = parseExportedLaunchesFile(raw)

  if (!parsed) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['Invalid launch file format. Expected JSON with a launches array.'],
    }
  }

  if (parsed.length === 0) {
    return {
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['No valid launches found in file.'],
    }
  }

  const builtInMints = getBuiltInMintAddresses()
  const deduped = dedupeExportedLaunches(parsed)
  const errors: string[] = []
  const accepted = new Map<string, SubmittedLaunchRecord>()
  let skipped = 0

  for (const item of deduped) {
    const mintKey = item.mintAddress.trim()

    if (builtInMints.has(mintKey)) {
      skipped += 1
      errors.push(
        `Skipped ${mintKey.slice(0, 8)}… — mint already exists in built-in catalog.`,
      )
      continue
    }

    accepted.set(mintKey, exportToSubmittedRecord(item))
  }

  if (accepted.size === 0) {
    return {
      success: false,
      imported: 0,
      skipped,
      errors: errors.length > 0
        ? errors
        : ['No launches could be imported.'],
    }
  }

  const existing = getSubmittedLaunchRecords()
  const merged = new Map<string, SubmittedLaunchRecord>()

  for (const record of existing) {
    merged.set(record.mintAddress.trim(), record)
  }

  let imported = 0

  for (const [mintKey, incoming] of accepted) {
    const current = merged.get(mintKey)

    if (
      !current ||
      recordTimestamp(incoming) >= recordTimestamp(current)
    ) {
      if (!current) {
        imported += 1
      } else if (recordTimestamp(incoming) > recordTimestamp(current)) {
        imported += 1
      }

      merged.set(mintKey, incoming)
      continue
    }

    skipped += 1
    errors.push(
      `Skipped ${mintKey.slice(0, 8)}… — existing local launch is newer.`,
    )
  }

  setSubmittedLaunchRecords([...merged.values()])

  return {
    success: true,
    imported,
    skipped,
    errors,
  }
}

export async function readLaunchesJsonFile(
  file: File,
): Promise<unknown> {
  const text = await file.text()
  return JSON.parse(text) as unknown
}
