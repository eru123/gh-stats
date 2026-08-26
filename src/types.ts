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

export interface StreakDay {
  date: string   // YYYY-MM-DD (UTC)
  count: number
}

export interface StreakRange {
  length: number
  start: string | null   // YYYY-MM-DD
  end:   string | null   // YYYY-MM-DD
}

export interface StreakData {
  totalContributions: number
  currentStreak: StreakRange
  longestStreak: StreakRange
  startingYear: number
  mode: 'daily' | 'weekly'
}

export interface StreakOptions extends CardOptions {
  mode?: 'daily' | 'weekly'
  starting_year?: number
  timezone?: string                 // IANA zone (e.g. Asia/Manila) or offset (+08:00, -5)
  exclude_days?: string[]           // day names: Sun, Mon, ...
  exclude_dates?: string[]          // YYYY-MM-DD, MM-DD (annual), or A..B ranges
  date_format?: string              // PHP-style: M j[, Y] — [..] hidden when year == current
  locale?: string                   // used for dates when date_format is absent
  card_width?: number
  disable_animations?: boolean
  // upstream github-readme-streak-stats color params (hex, # optional)
  background?: string
  border?: string
  stroke?: string
  ring?: string
  fire?: string
  currStreakNum?: string
  currStreakLabel?: string
  sideNums?: string
  sideLabels?: string
  dates?: string
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

// ── readme-typing-svg ─────────────────────────────────────────────────────────

export interface TypingOptions {
  font?: string                // font family name (default: monospace)
  color?: string               // text color (hex, no #) — default 36BCF7
  background?: string          // background color — default 00000000
  size?: number                // font size in px (default 20)
  width?: number               // svg width (default 400)
  height?: number              // svg height (default: computed)
  center?: boolean             // horizontally center text
  vCenter?: boolean            // vertically center text
  multiline?: boolean          // keep previous lines visible while typing
  duration?: number            // ms to type one line (default 5000)
  pause?: number               // ms to hold a finished line (default 0)
  repeat?: boolean             // loop forever (default true)
  letterSpacing?: string       // css letter-spacing (default normal)
}

// ── badges (shields-compatible static + custom icons) ─────────────────────────

export type BadgeStyle = 'flat' | 'plastic' | 'flat-square' | 'for-the-badge' | 'social'

export interface BadgeOptions {
  label: string
  message: string
  color: string               // resolved hex (no #)
  labelColor?: string         // resolved hex (no #)
  style?: BadgeStyle
  logoData?: string           // data:image/svg+xml;base64,... or undefined
  logoWidth?: number
  logoColorApplied?: boolean
}

// ── youtube cards ─────────────────────────────────────────────────────────────

export interface VideoData {
  id: string
  title: string
  thumbnailData: string       // data:image/jpeg;base64,...
  publishedAt: string         // ISO
  viewCount: number
  channelTitle: string
}

export interface VideosOptions {
  width?: number              // card width (default 250)
  border_radius?: number      // default 8
  background_color?: string   // default ffffff
  title_color?: string        // default 000000
  stats_color?: string        // default 000000
  max_title_lines?: number    // default 1
  max_videos?: number         // default 6
}
