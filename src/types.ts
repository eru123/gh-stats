export interface CardOptions {
  username?: string
  theme?: string
  title_color?: string
  text_color?: string
  bg_color?: string
  icon_color?: string
  border_color?: string
  hide_border?: boolean
  cache_seconds?: number
  hide_title?: boolean
  custom_title?: string
  border_radius?: number
  locale?: string
}

export interface StatsOptions extends CardOptions {
  hide?: string           // comma-separated: stars,commits,prs,issues,contribs
  show_icons?: boolean
  include_all_commits?: boolean
  hide_rank?: boolean
  ring_color?: string
  number_format?: 'short' | 'long'
}

export interface LangsOptions extends CardOptions {
  layout?: 'normal' | 'compact' | 'donut' | 'pie'
  langs_count?: number
  hide?: string           // comma-separated language names
  exclude_repo?: string
  hide_progress?: boolean
}

export interface RepoOptions extends CardOptions {
  repo: string
  show_owner?: boolean
}

export interface GitHubStats {
  name: string
  totalStars: number
  totalCommits: number
  totalPRs: number
  totalIssues: number
  totalReviews: number
  followers: number
  rank: { level: string; percentile: number }
}

export interface RepoData {
  name: string
  nameWithOwner: string
  description: string | null
  stargazers: number
  forks: number
  primaryLanguage: { name: string; color: string } | null
  isArchived: boolean
}

export interface LangData {
  [name: string]: { color: string; size: number; count: number }
}

export interface AsciiOptions extends CardOptions {
  color?: string                           // pixel block color (hex, no #) — falls back to title_color then theme
  style?: 'block' | 'outline' | 'shadow' | 'neon'  // rendering style (default: 'block')
  size?: 'sm' | 'md' | 'lg' | 'xl'        // block size preset (default: 'md')
  block_w?: number                         // block width in px — overrides size preset
  block_h?: number                         // block height in px — overrides size preset
  gap?: number                             // gap between blocks in px
  char_spacing?: number                    // extra space between characters in px
  block_radius?: number                    // border-radius of each block (default: 2)
}
