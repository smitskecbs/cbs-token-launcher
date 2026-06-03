/**
 * CBS ecosystem tool entry for the Tools section.
 */
export interface CbsTool {
  id: string
  name: string
  description: string
  url: string
  /** Emoji or letter fallback when no logo is available */
  iconFallback: string
  /** Bundled logo URL from project assets */
  logoUrl?: string
  /** Marks the tool that corresponds to this app */
  isCurrent?: boolean
}
