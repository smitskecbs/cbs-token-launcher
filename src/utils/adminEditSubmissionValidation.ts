import {
  validateSubmitLaunchForm,
  type SubmitLaunchFormValues,
} from './submitLaunchValidation'

export interface AdminEditSubmissionFormValues extends SubmitLaunchFormValues {
  buyUrl: string
  poolUrl: string
  raydiumUrl: string
  jupiterUrl: string
}

export interface AdminEditSubmissionValidationResult {
  valid: boolean
  error?: string
  values?: AdminEditSubmissionFormValues
}

const MAX_OPTIONAL_URL_LENGTH = 500

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
  const poolUrl = trimField(values.poolUrl)
  const raydiumUrl = trimField(values.raydiumUrl)
  const jupiterUrl = trimField(values.jupiterUrl)

  const urlFields = [
    { label: 'Buy URL', value: buyUrl },
    { label: 'Pool URL', value: poolUrl },
    { label: 'Raydium URL', value: raydiumUrl },
    { label: 'Jupiter URL', value: jupiterUrl },
  ]

  for (const field of urlFields) {
    if (field.value && !isValidOptionalUrl(field.value)) {
      return { valid: false, error: `${field.label} is invalid.` }
    }

    if (field.value.length > MAX_OPTIONAL_URL_LENGTH) {
      return { valid: false, error: `${field.label} is too long.` }
    }
  }

  return {
    valid: true,
    values: {
      ...base.values,
      buyUrl,
      poolUrl,
      raydiumUrl,
      jupiterUrl,
    },
  }
}
