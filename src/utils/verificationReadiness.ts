import type { Launch } from '../types/launch'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'
import { getLaunchOfficialLinks } from '../components/officialLinks'
import { hasResolvableLaunchLogo } from './resolveLaunchLogo'

export interface VerificationReadinessCheck {
  id: string
  label: string
  passed: boolean
  missingLabel?: string
}

export interface VerificationReadinessResult {
  checks: VerificationReadinessCheck[]
  passedCount: number
  totalCount: number
  isReady: boolean
}

export interface VerificationReadinessInput {
  mintAddress?: string | null
  name?: string | null
  symbol?: string | null
  description?: string | null
  logoUrl?: string | null
  website?: string | null
  telegram?: string | null
  x?: string | null
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

function getOfficialLinkFailureLabel(): string {
  return 'Missing official link'
}

export function evaluateVerificationReadiness(
  input: VerificationReadinessInput,
): VerificationReadinessResult {
  const hasOfficialLink =
    hasText(input.website) ||
    hasText(input.telegram) ||
    hasText(input.x)

  const checks: VerificationReadinessCheck[] = [
    {
      id: 'mint',
      label: 'Mint address',
      passed: hasText(input.mintAddress),
      missingLabel: 'Missing mint address',
    },
    {
      id: 'name',
      label: 'Project name',
      passed: hasText(input.name),
      missingLabel: 'Missing project name',
    },
    {
      id: 'symbol',
      label: 'Symbol',
      passed: hasText(input.symbol),
      missingLabel: 'Missing symbol',
    },
    {
      id: 'description',
      label: 'Description',
      passed: hasText(input.description),
      missingLabel: 'Missing description',
    },
    {
      id: 'logo',
      label: 'Metadata/logo',
      passed: hasResolvableLaunchLogo({
        logo: input.logoUrl?.trim() || undefined,
        mintAddress: input.mintAddress?.trim() || '',
      }),
      missingLabel: 'Missing logo',
    },
    {
      id: 'official-link',
      label: 'Official link',
      passed: hasOfficialLink,
      missingLabel: getOfficialLinkFailureLabel(),
    },
  ]

  const passedCount = checks.filter((check) => check.passed).length

  return {
    checks,
    passedCount,
    totalCount: checks.length,
    isReady: passedCount === checks.length,
  }
}

export function evaluateVerificationReadinessFromSubmission(
  submission: LaunchSubmissionSummary,
): VerificationReadinessResult {
  return evaluateVerificationReadiness({
    mintAddress: submission.mintAddress,
    name: submission.projectName,
    symbol: submission.tokenSymbol,
    description: submission.description,
    logoUrl: submission.logoUrl,
    website: submission.website,
    telegram: submission.telegram,
    x: submission.x,
  })
}

export function evaluateVerificationReadinessFromLaunch(
  launch: Launch,
): VerificationReadinessResult {
  const links = getLaunchOfficialLinks(launch)

  return evaluateVerificationReadiness({
    mintAddress: launch.mintAddress,
    name: launch.name,
    symbol: launch.symbol,
    description: launch.description,
    logoUrl: launch.logo,
    website: links.website,
    telegram: links.telegram,
    x: links.twitter,
  })
}

export function evaluateVerificationReadinessFromAdminForm(values: {
  projectName: string
  tokenSymbol: string
  mintAddress: string
  logoUrl: string
  website: string
  telegram: string
  x: string
  description: string
}): VerificationReadinessResult {
  return evaluateVerificationReadiness({
    mintAddress: values.mintAddress,
    name: values.projectName,
    symbol: values.tokenSymbol,
    description: values.description,
    logoUrl: values.logoUrl,
    website: values.website,
    telegram: values.telegram,
    x: values.x,
  })
}
