import type { LaunchSection, LaunchStatus, LaunchVerificationLevel } from '../types/launch'

/** Launch-only fields exported for backup and backend migration */
export interface ExportedLaunch {
  mintAddress: string
  launchStatus: LaunchStatus
  launchSection: LaunchSection
  launchDate: string
  createdAt: number
  updatedAt: number
  verificationLevel?: LaunchVerificationLevel
}

export interface ExportedLaunchesFile {
  version: 1
  exportedAt: number
  launches: ExportedLaunch[]
}

export interface LaunchImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: string[]
}
