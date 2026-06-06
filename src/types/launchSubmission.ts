import type { LaunchSubmissionStatus } from '../utils/launchSubmissionStatus'

export interface LaunchSubmissionSummary {
  id: string
  projectName: string
  tokenSymbol: string
  mintAddress: string
  status: LaunchSubmissionStatus | string
  logoUrl: string | null
  website: string | null
  telegram: string | null
  x: string | null
  description: string | null
  contactEmail: string | null
  verified: boolean
  createdAt: string
}

export interface ListLaunchSubmissionsResponse {
  ok: true
  count: number
  submissions: LaunchSubmissionSummary[]
}
