import {
  validateSubmitLaunchForm,
  type SubmitLaunchFormValues,
} from './submitLaunchValidation'

export interface AdminEditSubmissionFormValues extends SubmitLaunchFormValues {
  buyUrl: string
}

export interface AdminEditSubmissionValidationResult {
  valid: boolean
  error?: string
  values?: AdminEditSubmissionFormValues
}

const MAX_BUY_URL_LENGTH = 500

function trimField(value: string): string {
  return value.trim()
}

function isValidOptionalUrl(value: string): boolean {
  if (!value) {
    return true
  }

  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function validateAdminEditSubmissionForm(
  values: AdminEditSubmissionFormValues,
): AdminEditSubmissionValidationResult {
  const base = validateSubmitLaunchForm(values)

  if (!base.valid || !base.values) {
    return { valid: false, error: base.error }
  }

  const buyUrl = trimField(values.buyUrl)

  if (buyUrl && !isValidOptionalUrl(buyUrl)) {
    return { valid: false, error: 'Buy URL is invalid.' }
  }

  if (buyUrl.length > MAX_BUY_URL_LENGTH) {
    return { valid: false, error: 'Buy URL is too long.' }
  }

  return {
    valid: true,
    values: {
      ...base.values,
      buyUrl,
    },
  }
}
