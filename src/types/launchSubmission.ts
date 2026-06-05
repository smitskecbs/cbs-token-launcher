export interface LaunchSubmissionSummary {
  id: string
  projectName: string
  tokenSymbol: string
  mintAddress: string
  status: string
  createdAt: string
}

export interface ListLaunchSubmissionsResponse {
  ok: true
  count: number
  submissions: LaunchSubmissionSummary[]
}
