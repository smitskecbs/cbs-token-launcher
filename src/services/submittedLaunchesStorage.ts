import type {
  Launch,
  LaunchSection,
  LaunchStatus,
  LaunchVerificationLevel,
} from '../types/launch'
import {
  isValidLaunchDate,
  isValidLaunchSection,
  isValidLaunchStatus,
  isValidVerificationLevel,
  normalizeVerificationLevel,
  validateEditableLaunchFields,
} from '../utils/launchValidation'

const STORAGE_KEY = 'cbs-launcher:submitted-launches'

/** A launch submitted locally via the Submit Launch form */
export interface SubmittedLaunchRecord {
  id: string
  mintAddress: string
  section: LaunchSection
  status: LaunchStatus
  launchDate: string
  submittedAt: number
  updatedAt?: number
  tokenName: string | null
  tokenSymbol: string | null
  verificationLevel?: LaunchVerificationLevel
}

const STATUS_LAUNCH_LABELS: Record<LaunchStatus, string> = {
  preparing: 'Preparing',
  live: 'Live',
  ended: 'Ended',
}

interface StoredPayload {
  launches: SubmittedLaunchRecord[]
}

function sanitizeSubmittedLaunchRecord(
  value: unknown,
): SubmittedLaunchRecord | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Partial<SubmittedLaunchRecord>
  const mintAddress = record.mintAddress?.trim()
  const id = record.id?.trim()
  const launchDate = record.launchDate?.trim() ?? ''
  const status = record.status ?? ''
  const section = record.section ?? ''

  const createdAt =
    typeof record.submittedAt === 'number'
      ? record.submittedAt
      : NaN
  const updatedAt =
    typeof record.updatedAt === 'number'
      ? record.updatedAt
      : createdAt

  if (
    !id ||
    !mintAddress ||
    Number.isNaN(createdAt) ||
    !isValidLaunchDate(launchDate) ||
    !isValidLaunchStatus(status) ||
    !isValidLaunchSection(section)
  ) {
    return null
  }

  return {
    id,
    mintAddress,
    status,
    section,
    launchDate,
    submittedAt: createdAt,
    updatedAt,
    tokenName:
      typeof record.tokenName === 'string' ? record.tokenName : null,
    tokenSymbol:
      typeof record.tokenSymbol === 'string' ? record.tokenSymbol : null,
    verificationLevel: isValidVerificationLevel(
      record.verificationLevel ?? '',
    )
      ? record.verificationLevel
      : 'normal',
  }
}

function dedupeSubmittedLaunchRecords(
  records: SubmittedLaunchRecord[],
): SubmittedLaunchRecord[] {
  const byMint = new Map<string, SubmittedLaunchRecord>()

  for (const record of records) {
    const mintKey = record.mintAddress.trim()
    const existing = byMint.get(mintKey)

    if (
      !existing ||
      (record.updatedAt ?? record.submittedAt) >=
        (existing.updatedAt ?? existing.submittedAt)
    ) {
      byMint.set(mintKey, record)
    }
  }

  return [...byMint.values()]
}

function readPayload(): StoredPayload {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return { launches: [] }
    }

    const parsed = JSON.parse(raw) as StoredPayload

    if (!Array.isArray(parsed.launches)) {
      return { launches: [] }
    }

    const launches = dedupeSubmittedLaunchRecords(
      parsed.launches
        .map(sanitizeSubmittedLaunchRecord)
        .filter((record): record is SubmittedLaunchRecord => record !== null),
    )

    return { launches }
  } catch {
    return { launches: [] }
  }
}

function writePayload(payload: StoredPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore quota errors
  }
}

export function getSubmittedLaunchRecords(): SubmittedLaunchRecord[] {
  return readPayload().launches
}

export function setSubmittedLaunchRecords(
  records: SubmittedLaunchRecord[],
): void {
  const sanitized = dedupeSubmittedLaunchRecords(
    records
      .map(sanitizeSubmittedLaunchRecord)
      .filter((record): record is SubmittedLaunchRecord => record !== null),
  )

  writePayload({ launches: sanitized })
}

export function getSubmittedLaunchRecordById(
  id: string,
): SubmittedLaunchRecord | undefined {
  return readPayload().launches.find((entry) => entry.id === id)
}

export function isLocallyManagedLaunch(launch: Launch): boolean {
  return launch.locallyManaged === true
}

export interface EditableLaunchFields {
  status: LaunchStatus
  section: LaunchSection
  launchDate: string
  verificationLevel: LaunchVerificationLevel
}

export function updateSubmittedLaunchRecord(
  id: string,
  fields: EditableLaunchFields,
): boolean {
  const validation = validateEditableLaunchFields(fields)

  if (!validation.valid) {
    return false
  }

  const payload = readPayload()
  const index = payload.launches.findIndex((entry) => entry.id === id)

  if (index === -1) {
    return false
  }

  payload.launches[index] = {
    ...payload.launches[index],
    status: fields.status,
    section: fields.section,
    launchDate: fields.launchDate.trim(),
    verificationLevel: fields.verificationLevel,
    updatedAt: Date.now(),
  }

  writePayload(payload)
  return true
}

export function removeSubmittedLaunchRecord(id: string): boolean {
  const payload = readPayload()
  const nextLaunches = payload.launches.filter((entry) => entry.id !== id)

  if (nextLaunches.length === payload.launches.length) {
    return false
  }

  writePayload({ launches: nextLaunches })
  return true
}

export function saveSubmittedLaunchRecord(
  record: SubmittedLaunchRecord,
): boolean {
  const validation = validateEditableLaunchFields({
    status: record.status,
    section: record.section,
    launchDate: record.launchDate,
  })

  if (
    !validation.valid ||
    !isValidLaunchStatus(record.status) ||
    !isValidLaunchSection(record.section) ||
    !isValidLaunchDate(record.launchDate)
  ) {
    return false
  }

  const payload = readPayload()
  payload.launches = payload.launches.filter(
    (entry) => entry.mintAddress.trim() !== record.mintAddress.trim(),
  )
  const now = Date.now()
  payload.launches.push({
    ...record,
    mintAddress: record.mintAddress.trim(),
    launchDate: record.launchDate.trim(),
    updatedAt: record.updatedAt ?? now,
  })
  writePayload(payload)
  return true
}

export function createSubmittedLaunchId(mintAddress: string): string {
  const trimmed = mintAddress.trim()

  return `submitted-${trimmed.slice(0, 8).toLowerCase()}`
}

export function isMintAlreadyListed(
  mintAddress: string,
  catalog: Launch[],
): boolean {
  const normalized = mintAddress.trim()

  return catalog.some(
    (launch) => launch.mintAddress.trim() === normalized,
  )
}

export function submittedRecordToLaunch(
  record: SubmittedLaunchRecord,
): Launch {
  const symbol = record.tokenSymbol?.trim()
  const name = record.tokenName?.trim()

  return {
    id: record.id,
    mintAddress: record.mintAddress,
    status: record.status,
    section: record.section,
    autoLoadMetadata: true,
    name: name || undefined,
    symbol: symbol || undefined,
    logoFallback: symbol?.charAt(0).toUpperCase() ?? '🪙',
    locallyManaged: true,
    submittedAt: record.submittedAt,
    verificationLevel: normalizeVerificationLevel(record.verificationLevel),
    launchInfo: {
      launchStatus: STATUS_LAUNCH_LABELS[record.status],
      tradingStatus: '—',
      poolStatus: '—',
      launchDate: record.launchDate,
    },
  }
}

export function getSubmittedLaunchesAsLaunches(): Launch[] {
  return getSubmittedLaunchRecords().map(submittedRecordToLaunch)
}
