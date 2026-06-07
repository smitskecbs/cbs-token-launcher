import type { Launch } from './launch'

export type RecentActivityType =
  | 'new_launch_submitted'
  | 'launch_approved'
  | 'launch_moved_to_coming_soon'
  | 'launch_moved_to_live'
  | 'interest_vote_received'
  | 'launch_update_posted'

export interface RecentActivityItem {
  id: string
  type: RecentActivityType
  launch: Launch
  occurredAt: string
}
