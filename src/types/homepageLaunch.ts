export interface HomepageLaunchSubmission {
  id: string
  projectName: string
  tokenSymbol: string
  mintAddress: string
  status: 'coming_soon' | 'live'
  description: string | null
  website: string | null
  logoUrl: string | null
  telegram: string | null
  x: string | null
  verified: boolean
  featured: boolean
  createdAt: string
}

export interface HomepageLaunchesResponse {
  ok: true
  count: number
  launches: HomepageLaunchSubmission[]
}
