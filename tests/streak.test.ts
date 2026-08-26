import { describe, it, expect } from 'vitest'
import { computeStreaks } from '../src/fetchers/streak'
import { formatDate, renderStreakCard } from '../src/cards/streak-card'

function days(spec: Record<string, number>): Map<string, number> {
  return new Map(Object.entries(spec))
}

const TODAY = '2026-08-26'

describe('computeStreaks — daily', () => {
  it('computes totals, current and longest streaks', () => {
    const m = days({
      '2026-08-20': 3, '2026-08-21': 1, '2026-08-22': 5,
      '2026-08-23': 0, '2026-08-24': 2, '2026-08-25': 1, '2026-08-26': 4,
      '2026-01-01': 1, '2026-01-02': 1, '2026-01-03': 1, '2026-01-04': 1,
    })
    const r = computeStreaks(m, { today: TODAY })

    expect(r.totalContributions).toBe(20)
    expect(r.currentStreak).toEqual({ length: 3, start: '2026-08-24', end: '2026-08-26' })
    expect(r.longestStreak).toEqual({ length: 4, start: '2026-01-01', end: '2026-01-04' })
  })

  it('today with no contributions does not break the current streak (grace day)', () => {
    const m = days({
      '2026-08-24': 2, '2026-08-25': 1, // today 2026-08-26 empty
    })
    const r = computeStreaks(m, { today: TODAY })
    expect(r.currentStreak).toEqual({ length: 2, start: '2026-08-24', end: '2026-08-25' })
  })

  it('two idle days reset the current streak to zero', () => {
    const m = days({ '2026-08-22': 1, '2026-08-23': 1 })
    const r = computeStreaks(m, { today: TODAY })
    expect(r.currentStreak.length).toBe(0)
    expect(r.currentStreak.start).toBeNull()
  })

  it('excluded weekdays are transparent and their contributions not counted', () => {
    // Mon 24, Tue 25, Wed 26 active; Mon and Wed excluded
    const m = days({ '2026-08-24': 5, '2026-08-25': 1, '2026-08-26': 7 })
    const r = computeStreaks(m, { today: TODAY, excludeDays: ['Mon', 'Wednesday'] })
    // only Tue 25 counts
    expect(r.totalContributions).toBe(1)
    // streak bridges across the excluded days
    expect(r.currentStreak).toEqual({ length: 1, start: '2026-08-25', end: '2026-08-25' })
  })

  it('an excluded day WITH contributions does not break a run', () => {
    const m = days({ '2026-08-24': 5, '2026-08-25': 9, '2026-08-26': 1 })
    const r = computeStreaks(m, { today: TODAY, excludeDays: ['Tue'] })
    expect(r.totalContributions).toBe(6)   // 25th not counted
    expect(r.currentStreak.length).toBe(2) // 24th + 26th, bridged
  })

  it('exclude_dates supports exact dates, annual MM-DD and A..B ranges', () => {
    const m = days({
      '2026-08-20': 1, '2026-08-21': 1, '2026-08-22': 1, '2026-08-23': 1,
      '2025-08-21': 1, // annual 08-21 must be excluded in every year
      '2026-07-31': 1, '2026-08-01': 1, // 07-31 is inside range 07-30..08-01
    })
    const r = computeStreaks(m, {
      today: TODAY,
      excludeDates: ['2026-08-20', '08-21', '2026-07-30..2026-08-01'],
    })
    // counted: 08-22, 08-23 (08-20 exact, 08-21 annual, 07-31+08-01 range excluded)
    expect(r.totalContributions).toBe(2)
    expect(r.longestStreak).toEqual({ length: 2, start: '2026-08-22', end: '2026-08-23' })
  })

  it('handles an empty calendar', () => {
    const r = computeStreaks(new Map(), { today: TODAY })
    expect(r.totalContributions).toBe(0)
    expect(r.currentStreak.length).toBe(0)
    expect(r.longestStreak.length).toBe(0)
  })
})

describe('computeStreaks — weekly', () => {
  it('counts consecutive Sun–Sat weeks with at least one contribution', () => {
    // week of 2026-08-16 (Sun) .. 2026-08-22: two active days
    // week of 2026-08-23 .. 2026-08-29: one active day (26th)
    const m = days({ '2026-08-17': 1, '2026-08-19': 1, '2026-08-26': 1 })
    const r = computeStreaks(m, { today: TODAY, mode: 'weekly' })
    expect(r.mode).toBe('weekly')
    expect(r.currentStreak.length).toBe(2)
    expect(r.currentStreak.start).toBe('2026-08-17')
    expect(r.currentStreak.end).toBe('2026-08-26')
  })

  it('an empty current week does not break an ongoing weekly streak', () => {
    // active weeks: 07-26..08-01, 08-02..08-08; current week (08-23) empty
    const m = days({ '2026-07-30': 1, '2026-08-05': 1 })
    const r = computeStreaks(m, { today: TODAY, mode: 'weekly' })
    expect(r.currentStreak.length).toBe(0) // gap weeks broke it long ago
    expect(r.longestStreak.length).toBe(2)
  })
})

describe('formatDate (PHP-style)', () => {
  it('renders tokens and hides [bracketed] content for the current year', () => {
    expect(formatDate('2026-08-26', 'M j[, Y]', 2026)).toBe('Aug 26')
    expect(formatDate('2024-12-01', 'M j[, Y]', 2026)).toBe('Dec 1, 2024')
  })

  it('supports the full token set', () => {
    expect(formatDate('2026-03-01', 'l, F jS, Y', 2026)).toBe('Sunday, March 1st, 2026')
    expect(formatDate('2026-03-02', 'D d-m-y', 2026)).toBe('Mon 02-03-26')
    expect(formatDate('2026-03-03', 'n/j/Y', 2026)).toBe('3/3/2026')
    expect(formatDate('2026-03-11', 'jS', 2026)).toBe('11th')
  })

  it('escapes literals with backslash', () => {
    expect(formatDate('2026-08-26', '\\M j', 2026)).toBe('M 26')
  })
})

describe('renderStreakCard', () => {
  const data = {
    totalContributions: 1234,
    currentStreak: { length: 7, start: '2026-08-20', end: '2026-08-26' },
    longestStreak: { length: 30, start: '2026-01-02', end: '2026-01-31' },
    startingYear: 2016,
    mode: 'daily' as const,
  }

  it('renders the three sections with themed colors', () => {
    const svg = renderStreakCard(data, { username: 'eru123', theme: 'dark' })
    expect(svg).toContain('<svg')
    expect(svg).toContain('Total Contributions')
    expect(svg).toContain('Current Streak')
    expect(svg).toContain('Longest Streak')
    expect(svg).toContain('1,234')
    expect(svg).toContain('#151515') // dark theme bg
  })

  it('hides the title by default and shows it with hide_title=false', () => {
    expect(renderStreakCard(data, { username: 'eru123' })).not.toContain('GitHub Streak')
    expect(renderStreakCard(data, { username: 'eru123', hide_title: false })).toContain('eru123 GitHub Streak')
  })

  it('applies upstream color params over theme', () => {
    const svg = renderStreakCard(data, { username: 'eru123', fire: '#ff0000', sideNums: '00ff00' })
    expect(svg).toContain('fill="#ff0000"')
    expect(svg).toContain('fill="#00ff00"')
  })

  it('ignores malformed colors', () => {
    const svg = renderStreakCard(data, { username: 'eru123', fire: 'not-a-color' })
    expect(svg).not.toContain('not-a-color')
  })

  it('renders weekly labels in weekly mode', () => {
    const svg = renderStreakCard({ ...data, mode: 'weekly' }, { username: 'eru123' })
    expect(svg).toContain('Current Streak (weeks)')
  })

  it('current streak number contrasts with the ring disc on every theme', () => {
    for (const theme of ['default', 'dark', 'radical', 'tokyonight', 'dracula', 'gruvbox', 'onedark', 'transparent']) {
      const svg = renderStreakCard(data, { username: 'eru123', theme })
      const disc = svg.match(/<circle r="42" fill="#([0-9a-f]+)"/)?.[1]
      const number = svg.match(/<text y="21"[^>]*fill="#([0-9a-f]+)"/)?.[1]
      expect(disc, `theme=${theme}: ring disc not found`).toBeDefined()
      expect(number, `theme=${theme}: streak number not found`).toBeDefined()
      expect(disc, `theme=${theme}: number invisible on ring disc`).not.toBe(number)
    }
  })
})
