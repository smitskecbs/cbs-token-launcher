export interface LaunchUpdate {
  id: string
  title: string
  content: string
  createdAt: string
  submissionId?: string | null
  launchId?: string | null
}

export interface LaunchUpdatesResponse {
  ok: true
  count: number
  updates: LaunchUpdate[]
}
