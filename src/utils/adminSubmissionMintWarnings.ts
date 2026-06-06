import { launches } from '../data/launches'
import type { LaunchSubmissionSummary } from '../types/launchSubmission'

export const DUPLICATE_MINT_WARNING_MESSAGE =
  'Duplicate mint — only one card will appear on homepage'

export function getBuiltInLaunchMintAddresses(): Set<string> {
  return new Set(
    launches.map((launch) => launch.mintAddress.trim()).filter(Boolean),
  )
}

export function getSubmissionIdsWithMintWarning(
  submissions: LaunchSubmissionSummary[],
): Set<string> {
  const builtInMints = getBuiltInLaunchMintAddresses()
  const mintCounts = new Map<string, number>()

  for (const submission of submissions) {
    const mint = submission.mintAddress.trim()

    if (!mint) {
      continue
    }

    mintCounts.set(mint, (mintCounts.get(mint) ?? 0) + 1)
  }

  const warnedIds = new Set<string>()

  for (const submission of submissions) {
    const mint = submission.mintAddress.trim()

    if (!mint) {
      continue
    }

    const isDuplicateAmongSubmissions = (mintCounts.get(mint) ?? 0) > 1
    const matchesBuiltInLaunch = builtInMints.has(mint)

    if (isDuplicateAmongSubmissions || matchesBuiltInLaunch) {
      warnedIds.add(submission.id)
    }
  }

  return warnedIds
}
