import { isValidMintAddress } from '../solana/getTokenInfo'

export interface SubmitLaunchFormValues {
  projectName: string
  tokenSymbol: string
  mintAddress: string
  website: string
  telegram: string
  x: string
  description: string
  contactEmail: string
}

export interface SubmitLaunchValidationResult {
  valid: boolean
  error?: string
  values?: SubmitLaunchFormValues
}

const MAX_LENGTH = {
  projectName: 120,
  tokenSymbol: 20,
  description: 2000,
  website: 500,
  telegram: 200,
  x: 200,
  contactEmail: 254,
} as const

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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function validateSubmitLaunchForm(
  values: SubmitLaunchFormValues,
): SubmitLaunchValidationResult {
  const projectName = trimField(values.projectName)
  const tokenSymbol = trimField(values.tokenSymbol)
  const mintAddress = trimField(values.mintAddress)
  const website = trimField(values.website)
  const telegram = trimField(values.telegram)
  const x = trimField(values.x)
  const description = trimField(values.description)
  const contactEmail = trimField(values.contactEmail)

  if (!projectName) {
    return { valid: false, error: 'Project name is required.' }
  }

  if (!tokenSymbol) {
    return { valid: false, error: 'Token symbol is required.' }
  }

  if (!mintAddress) {
    return { valid: false, error: 'Mint address is required.' }
  }

  if (!isValidMintAddress(mintAddress)) {
    return { valid: false, error: 'Mint address format is invalid.' }
  }

  if (!description) {
    return { valid: false, error: 'Description is required.' }
  }

  if (projectName.length > MAX_LENGTH.projectName) {
    return { valid: false, error: 'Project name is too long.' }
  }

  if (tokenSymbol.length > MAX_LENGTH.tokenSymbol) {
    return { valid: false, error: 'Token symbol is too long.' }
  }

  if (description.length > MAX_LENGTH.description) {
    return { valid: false, error: 'Description is too long.' }
  }

  if (website && !isValidOptionalUrl(website)) {
    return { valid: false, error: 'Website URL is invalid.' }
  }

  if (website.length > MAX_LENGTH.website) {
    return { valid: false, error: 'Website URL is too long.' }
  }

  if (telegram.length > MAX_LENGTH.telegram) {
    return { valid: false, error: 'Telegram value is too long.' }
  }

  if (x.length > MAX_LENGTH.x) {
    return { valid: false, error: 'X value is too long.' }
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    return { valid: false, error: 'Contact email is invalid.' }
  }

  if (contactEmail.length > MAX_LENGTH.contactEmail) {
    return { valid: false, error: 'Contact email is too long.' }
  }

  return {
    valid: true,
    values: {
      projectName,
      tokenSymbol,
      mintAddress,
      website,
      telegram,
      x,
      description,
      contactEmail,
    },
  }
}
