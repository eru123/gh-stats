import { CustomError } from '../utils/errors'
import { StreakData, StreakDay, StreakRange } from '../types'

export interface FetchStreakOptions {
  token: string
  starting_year?: number
  timezone?: string              // IANA zone (e.g. Asia/Manila) or fixed offset (+08:00, -5)
  mode?: 'daily' | 'weekly'
  exclude_days?: string[]        // day names: Sun, Mon, ...
  exclude_dates?: string[]       // YYYY-MM-DD, MM-DD (annual), or "A..B" ranges
}

const GITHUB_CREATED_FLOOR = 2008       // GitHub launched in 2008 — no data before that
const MAX_YEAR_SPAN = 25                // cap aliases per GraphQL request

// ── ISO date-string helpers (all arithmetic in UTC to avoid TZ pitfalls) ──────

function isoToUtc(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function utcToIso(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(iso: string, n: number): string {
  return utcToIso(new Date(isoToUtc(iso).getTime() + n * 86400000))
}

function diffDays(a: string, b: string): number {
  return Math.round((isoToUtc(a).getTime() - isoToUtc(b).getTime()) / 86400000)
}

function dayOfWeek(iso: string): number {
  return isoToUtc(iso).getUTCDay() // 0 = Sunday
}

function weekStart(iso: string): string {
  return addDays(iso, -dayOfWeek(iso))
}

function todayInZone(tz?: string): string {
  if (!tz) return utcToIso(new Date())
  const offsetMatch = tz.match(/^([+-])(\d{1,2})(?::(\d{2}))?$/)
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? -1 : 1
    const hours = parseInt(offsetMatch[2])
    const minutes = offsetMatch[3] ? parseInt(offsetMatch[3]) : 0
    return utcToIso(new Date(Date.now() + sign * (hours * 60 + minutes) * 60000))
  }
  try {
    // en-CA formats as YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
  } catch {
    return utcToIso(new Date())
  }
}

// ── Exclusion parsing ─────────────────────────────────────────────────────────

const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

interface Exclusions {
  daysOfWeek: Set<number>
  dates: Set<string>                  // exact YYYY-MM-DD
  annual: Set<string>                 // MM-DD, applies to every year
  ranges: { start: string; end: string }[]
}

function parseExclusions(excludeDays?: string[], excludeDates?: string[]): Exclusions {
  const excl: Exclusions = { daysOfWeek: new Set(), dates: new Set(), annual: new Set(), ranges: [] }

  for (const raw of excludeDays || []) {
    const key = raw.trim().toLowerCase().slice(0, 3)
    const idx = DAY_NAMES.indexOf(key)
    if (idx !== -1) excl.daysOfWeek.add(idx)
  }

  for (const raw of excludeDates || []) {
    const item = raw.trim()
    if (!item) continue
    const range = item.match(/^(\d{4}-\d{2}-\d{2})\s*\.\.\s*(\d{4}-\d{2}-\d{2})$/)
    if (range) {
      if (range[1] <= range[2]) excl.ranges.push({ start: range[1], end: range[2] })
      continue
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(item)) { excl.dates.add(item); continue }
    if (/^\d{2}-\d{2}$/.test(item)) excl.annual.add(item)
  }

  return excl
}

function isExcluded(iso: string, excl: Exclusions): boolean {
  if (excl.daysOfWeek.has(dayOfWeek(iso))) return true
  if (excl.dates.has(iso)) return true
  if (excl.annual.has(iso.slice(5))) return true
  for (const r of excl.ranges) {
    if (iso >= r.start && iso <= r.end) return true
  }
  return false
}

// ── Streak computation (pure — unit tested separately from GitHub I/O) ────────

export interface ComputeOptions {
  today: string                    // YYYY-MM-DD in the effective timezone
  mode?: 'daily' | 'weekly'
  excludeDays?: string[]
  excludeDates?: string[]
}

export function computeStreaks(
  contributions: Map<string, number>,
  options: ComputeOptions
): StreakData {
  const mode = options.mode === 'weekly' ? 'weekly' : 'daily'
  const excl = parseExclusions(options.excludeDays, options.excludeDates)
  const today = options.today

  const isActive = (iso: string) => (contributions.get(iso) || 0) > 0 && !isExcluded(iso, excl)
  // excluded days don't exist for streak purposes — skipped without breaking runs
  const isTransparent = (iso: string) => isExcluded(iso, excl)

  let totalContributions = 0
  for (const [date, count] of contributions) {
    if (count > 0 && !isExcluded(date, excl)) totalContributions += count
  }

  if (contributions.size === 0) {
    return {
      totalContributions,
      currentStreak: { length: 0, start: null, end: null },
      longestStreak: { length: 0, start: null, end: null },
      startingYear: parseInt(today.slice(0, 4)),
      mode,
    }
  }

  let firstDay = today
  for (const date of contributions.keys()) if (date < firstDay) firstDay = date
  if (firstDay < '2000-01-01') firstDay = '2000-01-01'

  if (mode === 'weekly') {
    // ── Weekly mode: streaks are consecutive weeks (Sun–Sat) with ≥1 active day
    const activeWeeks = new Set<string>()
    const weekDays = new Map<string, { first: string; last: string }>()
    for (let d = firstDay; d <= today; d = addDays(d, 1)) {
      if (d > today) break
      if (isActive(d)) {
        const wk = weekStart(d)
        activeWeeks.add(wk)
        const entry = weekDays.get(wk)
        if (!entry) weekDays.set(wk, { first: d, last: d })
        else entry.last = d
      }
    }

    const scanWeeks = (startWeek: string, endWeek: string) => {
      // returns runs of consecutive active weeks as StreakRanges
      const runs: StreakRange[] = []
      let runLen = 0, runStart: string | null = null, runEnd: string | null = null
      for (let wk = startWeek; wk <= endWeek; wk = addDays(wk, 7)) {
        if (activeWeeks.has(wk)) {
          const days = weekDays.get(wk)!
          if (runLen === 0) { runStart = days.first; runEnd = days.last }
          else runEnd = days.last
          runLen++
        } else if (runLen > 0) {
          runs.push({ length: runLen, start: runStart, end: runEnd })
          runLen = 0; runStart = null; runEnd = null
        }
      }
      if (runLen > 0) runs.push({ length: runLen, start: runStart, end: runEnd })
      return runs
    }

    const thisWeek = weekStart(today)
    const allRuns = scanWeeks(weekStart(firstDay), thisWeek)

    // current streak: walk back from this week; grace — an incomplete current
    // week with no contributions yet doesn't break the streak
    let currentWeek = thisWeek
    if (!activeWeeks.has(currentWeek)) currentWeek = addDays(currentWeek, -7)

    const currentRun = activeWeeks.has(currentWeek)
      ? scanWeeks(currentWeek, currentWeek)[0]
      : { length: 0, start: null, end: null }

    // extend backwards through all consecutive active weeks
    let currentStreak: StreakRange = currentRun
    if (currentStreak.length > 0) {
      let wk = currentWeek, len = 0
      let first = currentStreak.start, last = currentStreak.end
      while (activeWeeks.has(wk)) {
        const days = weekDays.get(wk)!
        first = days.first
        len++
        wk = addDays(wk, -7)
      }
      currentStreak = { length: len, start: first, end: last }
    }

    const longest = allRuns.reduce((best, r) => (r.length > best.length ? r : best),
      { length: 0, start: null, end: null } as StreakRange)

    return {
      totalContributions,
      currentStreak,
      longestStreak: longest,
      startingYear: parseInt(firstDay.slice(0, 4)),
      mode,
    }
  }

  // ── Daily mode ────────────────────────────────────────────────────────────
  // active days count; excluded days with no contributions are transparent
  // (skipped without breaking a run); anything else breaks the run.
  const scanDays = (start: string, end: string): StreakRange[] => {
    const runs: StreakRange[] = []
    let runLen = 0, runStart: string | null = null, runEnd: string | null = null
    for (let d = start; d <= end; d = addDays(d, 1)) {
      if (isActive(d)) {
        if (runLen === 0) runStart = d
        runEnd = d
        runLen++
      } else if (isTransparent(d)) {
        continue
      } else if (runLen > 0) {
        runs.push({ length: runLen, start: runStart, end: runEnd })
        runLen = 0; runStart = null; runEnd = null
      }
    }
    if (runLen > 0) runs.push({ length: runLen, start: runStart, end: runEnd })
    return runs
  }

  const allRuns = scanDays(firstDay, today)

  // current streak: count back from today; grace — today isn't over yet, so a
  // contribution-less today doesn't break a streak that ended yesterday
  let cursor = today
  if (!isActive(cursor) && !isTransparent(cursor)) cursor = addDays(today, -1)

  let currentStreak: StreakRange = { length: 0, start: null, end: null }
  if (isActive(cursor) || isTransparent(cursor)) {
    let len = 0
    let first: string | null = null, last: string | null = null
    let d = cursor
    while (d >= firstDay) {
      if (isActive(d)) {
        first = d
        if (!last) last = d
        len++
        d = addDays(d, -1)
      } else if (isTransparent(d)) {
        d = addDays(d, -1)
      } else {
        break
      }
    }
    currentStreak = { length: len, start: first, end: last }
  }

  const longest = allRuns.reduce((best, r) => (r.length > best.length ? r : best),
    { length: 0, start: null, end: null } as StreakRange)

  return {
    totalContributions,
    currentStreak,
    longestStreak: longest,
    startingYear: parseInt(firstDay.slice(0, 4)),
    mode,
  }
}

// ── GitHub GraphQL ────────────────────────────────────────────────────────────

async function graphql(query: string, variables: Record<string, unknown>, token: string): Promise<any> {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'gh-stats',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  }).catch(() => {
    throw new CustomError('Network error connecting to GitHub', 'NETWORK_ERROR')
  })

  if (!res.ok) {
    if (res.status === 401) throw new CustomError('Invalid GitHub token', 'INVALID_TOKEN')
    if (res.status === 403 || res.status === 429) throw new CustomError('API rate limit exceeded', 'RATE_LIMIT')
    throw new CustomError(`GitHub API error: ${res.status}`, 'SERVER_ERROR')
  }

  const json = await res.json() as any
  if (json.errors) {
    if (json.errors[0]?.type === 'NOT_FOUND') {
      throw new CustomError('User not found', 'USER_NOT_FOUND')
    }
    throw new CustomError(json.errors[0]?.message || 'GitHub API returned errors', 'SERVER_ERROR')
  }
  return json.data
}

export async function fetchStreak(username: string, options: FetchStreakOptions): Promise<StreakData> {
  // Step 1 — account creation year bounds the calendar scan
  const profile = await graphql(
    `query($login: String!) { user(login: $login) { createdAt } }`,
    { login: username },
    options.token
  )
  if (!profile?.user) throw new CustomError(`User "${username}" not found`, 'USER_NOT_FOUND')

  const currentYear = parseInt(todayInZone(options.timezone).slice(0, 4))
  const createdYear = new Date(profile.user.createdAt).getUTCFullYear()
  const requested = options.starting_year && Number.isFinite(options.starting_year)
    ? options.starting_year : createdYear
  const startYear = Math.max(
    GITHUB_CREATED_FLOOR,
    Math.min(requested, currentYear),
    currentYear - MAX_YEAR_SPAN + 1
  )

  // Step 2 — one batched request: each year aliased as its own collection
  const aliases: string[] = []
  for (let year = startYear; year <= currentYear; year++) {
    aliases.push(`
      y${year}: contributionsCollection(from: "${year}-01-01T00:00:00Z") {
        contributionCalendar {
          weeks { contributionDays { date contributionCount } }
        }
      }
    `)
  }

  const data = await graphql(
    `query($login: String!) { user(login: $login) { ${aliases.join('\n')} } }`,
    { login: username },
    options.token
  )
  if (!data?.user) throw new CustomError(`User "${username}" not found`, 'USER_NOT_FOUND')

  const today = todayInZone(options.timezone)
  const contributions = new Map<string, number>()
  for (let year = startYear; year <= currentYear; year++) {
    const weeks = data.user[`y${year}`]?.contributionCalendar?.weeks || []
    for (const week of weeks) {
      for (const day of week.contributionDays || []) {
        if (day.date <= today) {
          contributions.set(day.date, day.contributionCount)
        }
      }
    }
  }

  return computeStreaks(contributions, {
    today,
    mode: options.mode,
    excludeDays: options.exclude_days,
    excludeDates: options.exclude_dates,
  })
}
