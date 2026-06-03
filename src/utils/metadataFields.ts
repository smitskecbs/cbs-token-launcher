import type { TokenMetadataJson } from '../solana/fetchTokenMetadataJson'

/** Social URLs parsed from metadata JSON (primary source) */
export interface MetadataSocialLinks {
  website?: string
  telegram?: string
  twitter?: string
  discord?: string
  facebook?: string
  github?: string
}

export type MetadataSocialLinkKey = keyof MetadataSocialLinks

const SOCIAL_LINK_KEYS: MetadataSocialLinkKey[] = [
  'website',
  'telegram',
  'twitter',
  'discord',
  'facebook',
  'github',
]

function parseNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()

  return trimmed || undefined
}

/** Parse `extensions` object from CBS Token Builder metadata JSON */
export function parseMetadataExtensions(
  value: unknown,
): MetadataSocialLinks {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const extensions = value as Record<string, unknown>

  return {
    website: parseNonEmptyString(extensions.website),
    telegram: parseNonEmptyString(extensions.telegram),
    twitter: parseNonEmptyString(extensions.twitter),
    discord: parseNonEmptyString(extensions.discord),
    facebook: parseNonEmptyString(extensions.facebook),
    github: parseNonEmptyString(extensions.github),
  }
}

/** Parse `tags` array from metadata JSON — ignores empty strings */
export function parseMetadataTags(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  const tags: string[] = []

  for (const entry of value) {
    if (typeof entry !== 'string') {
      continue
    }

    const trimmed = entry.trim()

    if (trimmed) {
      tags.push(trimmed)
    }
  }

  return tags
}

/** Parse social links from metadata JSON (`extensions` + top-level `external_url`) */
export function parseMetadataSocialFromJson(
  json: TokenMetadataJson | null | undefined,
): MetadataSocialLinks {
  if (!json) {
    return {}
  }

  const fromExtensions = parseMetadataExtensions(json.extensions)
  const website =
    fromExtensions.website ??
    parseNonEmptyString(json.external_url)

  return {
    ...fromExtensions,
    website,
  }
}

export function hasMetadataSocialLinks(
  links: MetadataSocialLinks,
): boolean {
  return SOCIAL_LINK_KEYS.some((key) => Boolean(links[key]))
}

/** Metadata wins; catalog values fill only missing fields */
export function mergeSocialLinksPrimaryMetadata(
  metadataLinks: MetadataSocialLinks,
  catalogLinks: MetadataSocialLinks,
): MetadataSocialLinks {
  const merged: MetadataSocialLinks = {}

  for (const key of SOCIAL_LINK_KEYS) {
    const metadataValue = metadataLinks[key]
    const catalogValue = catalogLinks[key]

    merged[key] = metadataValue ?? catalogValue
  }

  return merged
}

/** Format tag text for badge display: "meme" → "Meme" */
export function formatMetadataTagLabel(tag: string): string {
  return tag
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(' ')
}
