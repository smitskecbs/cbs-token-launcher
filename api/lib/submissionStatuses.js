export const SUBMISSION_STATUSES = [
  'pending',
  'coming_soon',
  'live',
  'rejected',
]

export function isValidSubmissionStatus(status) {
  return SUBMISSION_STATUSES.includes(status)
}
