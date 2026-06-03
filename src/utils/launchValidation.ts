import type { LaunchSection, LaunchStatus, LaunchVerificationLevel } from '../types/launch'

const VALID_STATUSES: readonly LaunchStatus[] = [
  'preparing',
  'live',
  'ended',
]

const VALID_SECTIONS: readonly LaunchSection[] = [
  'featured',
  'ecosystem',
  'upcoming',
]

const VALID_VERIFICATION_LEVELS: readonly LaunchVerificationLevel[] = [
  'normal',
  'verified',
  'cbs-verified',
]

export function isValidLaunchStatus(
  value: string,
): value is LaunchStatus {
  return (VALID_STATUSES as readonly string[]).includes(value)
}

export function isValidLaunchSection(
  value: string,
): value is LaunchSection {
  return (VALID_SECTIONS as readonly string[]).includes(value)
}

export function isValidVerificationLevel(
  value: string,
): value is LaunchVerificationLevel {
  return (VALID_VERIFICATION_LEVELS as readonly string[]).includes(value)
}

export function normalizeVerificationLevel(
  value: string | undefined,
): LaunchVerificationLevel {
  if (value && isValidVerificationLevel(value)) {
    return value
  }

  return 'normal'
}

export function isValidLaunchDate(value: string): boolean {
  return value.trim().length > 0
}

export interface LaunchFieldValidation {
  valid: boolean
  error?: string
}

export interface EditableLaunchFieldValues {
  status: string
  section: string
  launchDate: string
  verificationLevel?: string
}

export function validateEditableLaunchFields(
  fields: EditableLaunchFieldValues,
): LaunchFieldValidation {
  if (!fields.status?.trim()) {
    return { valid: false, error: 'Launch status is required.' }
  }

  if (!fields.section?.trim()) {
    return { valid: false, error: 'Launch section is required.' }
  }

  if (!isValidLaunchDate(fields.launchDate)) {
    return { valid: false, error: 'Launch date is required.' }
  }

  if (!isValidLaunchStatus(fields.status)) {
    return { valid: false, error: 'Invalid launch status.' }
  }

  if (!isValidLaunchSection(fields.section)) {
    return { valid: false, error: 'Invalid launch section.' }
  }

  if (
    fields.verificationLevel !== undefined &&
    fields.verificationLevel !== '' &&
    !isValidVerificationLevel(fields.verificationLevel)
  ) {
    return { valid: false, error: 'Invalid verification level.' }
  }

  return { valid: true }
}
