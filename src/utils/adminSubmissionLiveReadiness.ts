import type { LaunchSubmissionSummary } from '../types/launchSubmission'

export interface LiveReadinessCheck {
  id: string
  label: string
  passed: boolean
}

export interface LiveReadinessResult {
  checks: LiveReadinessCheck[]
  isReady: boolean
  passedCount: number
  totalCount: number
}

function hasText(value: string | null | undefined): boolean {
  return Boolean(value?.trim())
}

export function evaluateLiveReadiness(
  submission: LaunchSubmissionSummary,
  options: { hasMintWarning: boolean },
): LiveReadinessResult {
  const hasOfficialLink =
    hasText(submission.website) ||
    hasText(submission.telegram) ||
    hasText(submission.x)

  const checks: LiveReadinessCheck[] = [
    {
      id: 'project-name',
      label: 'Project name',
      passed: hasText(submission.projectName),
    },
    {
      id: 'symbol',
      label: 'Symbol',
      passed: hasText(submission.tokenSymbol),
    },
    {
      id: 'mint',
      label: 'Mint address',
      passed: hasText(submission.mintAddress),
    },
    {
      id: 'description',
      label: 'Description',
      passed: hasText(submission.description),
    },
    {
      id: 'logo',
      label: 'Logo URL',
      passed: hasText(submission.logoUrl),
    },
    {
      id: 'official-link',
      label: 'Official link (website, Telegram, or X)',
      passed: hasOfficialLink,
    },
    {
      id: 'verified',
      label: 'Verified enabled',
      passed: submission.verified === true,
    },
    {
      id: 'unique-mint',
      label: 'No duplicate mint warning',
      passed: !options.hasMintWarning,
    },
  ]

  const passedCount = checks.filter((check) => check.passed).length

  return {
    checks,
    isReady: passedCount === checks.length,
    passedCount,
    totalCount: checks.length,
  }
}
