import type { Launch } from '../types/launch'

export interface LaunchUpdateTarget {
  submissionId?: string
  launchId?: string
  label: string
}

const SUBMISSION_PREFIX = 'submission-'

export function getLaunchUpdateTarget(launch: Launch): LaunchUpdateTarget {
  if (launch.id.startsWith(SUBMISSION_PREFIX)) {
    return {
      submissionId: launch.id.slice(SUBMISSION_PREFIX.length),
      label: launch.name?.trim() || launch.symbol?.trim() || launch.id,
    }
  }

  return {
    launchId: launch.id,
    label: launch.name?.trim() || launch.symbol?.trim() || launch.id,
  }
}

export function getSubmissionLaunchUpdateTarget(
  submissionId: string,
  projectName: string,
): LaunchUpdateTarget {
  return {
    submissionId,
    label: projectName.trim() || submissionId,
  }
}

export function getStaticLaunchUpdateTarget(
  launchId: string,
  label: string,
): LaunchUpdateTarget {
  return {
    launchId,
    label: label.trim() || launchId,
  }
}
