const STORAGE_KEY = 'cbs-launcher:launch-interest-voted'

function readVotedMints(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

function writeVotedMints(mints: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mints))
}

export function hasVotedForLaunchInterest(mintAddress: string): boolean {
  const trimmedMint = mintAddress.trim()

  if (!trimmedMint) {
    return false
  }

  return readVotedMints().includes(trimmedMint)
}

export function markLaunchInterestVoted(mintAddress: string): void {
  const trimmedMint = mintAddress.trim()

  if (!trimmedMint || hasVotedForLaunchInterest(trimmedMint)) {
    return
  }

  writeVotedMints([...readVotedMints(), trimmedMint])
}
