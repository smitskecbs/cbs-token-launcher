import type { LaunchSubmissionStatus } from '../utils/launchSubmissionStatus'

export interface LaunchSubmissionSummary {
  id: string
  projectName: string
  tokenSymbol: string
  mintAddress: string
  status: LaunchSubmissionStatus | string
  createdAt: string
}

export interface ListLaunchSubmissionsResponse {
  ok: true
  count: number
  submissions: LaunchSubmissionSummary[]
}
