import { describe, expect, it } from 'vitest'
import { calculateRank } from '../src/utils/rank'
import { formatNumber, escapeHtml, clamp } from '../src/utils/svg'
import { CustomError, renderErrorSVG } from '../src/utils/errors'
import { MemoryCache } from '../src/utils/cache'
import { themes } from '../src/themes/index'

describe('calculateRank', () => {
  it('rates a zero-stat account as C with percentile ~100', () => {
    const { level, percentile } = calculateRank({ commits: 0, stars: 0, prs: 0, issues: 0, followers: 0 })
    expect(level).toBe('C')
    expect(percentile).toBeCloseTo(100, 5)
  })

  it('rates a very strong account near the top', () => {
    const { level, percentile } = calculateRank({ commits: 5000, stars: 3000, prs: 400, issues: 200, followers: 2000 })
    expect(percentile).toBeLessThan(1)
    expect(level).toBe('S')
  })

  it('produces monotonic percentiles as stats grow', () => {
    let prev = 100
    for (let k = 0; k <= 10; k++) {
      const { percentile } = calculateRank({ commits: 100 * k, stars: 20 * k, prs: 5 * k, issues: 5 * k, followers: 10 * k })
      expect(percentile).toBeLessThanOrEqual(prev)
      prev = percentile
    }
  })

  it('caps score so percentile never goes below 0', () => {
    const { percentile } = calculateRank({ commits: 1e9, stars: 1e9, prs: 1e9, issues: 1e9, followers: 1e9 })
    expect(percentile).toBeGreaterThanOrEqual(0)
  })
})

describe('formatNumber', () => {
  it('short-formats thousands and millions', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(1000)).toBe('1k')
    expect(formatNumber(1500)).toBe('1.5k')
    expect(formatNumber(1000000)).toBe('1M')
    expect(formatNumber(2500000)).toBe('2.5M')
  })

  it('long-formats with locale separators', () => {
    expect(formatNumber(1234567, 'long')).toBe('1,234,567')
  })
})

describe('escapeHtml', () => {
  it('escapes all five XML metacharacters', () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;')
  })
})

describe('clamp', () => {
  it('clamps to range bounds', () => {
    expect(clamp(5, 1, 10)).toBe(5)
    expect(clamp(-5, 1, 10)).toBe(1)
    expect(clamp(50, 1, 10)).toBe(10)
  })
})

describe('CustomError / renderErrorSVG', () => {
  it('carries its type', () => {
    const err = new CustomError('nope', 'RATE_LIMIT')
    expect(err).toBeInstanceOf(Error)
    expect(err.type).toBe('RATE_LIMIT')
    expect(err.message).toBe('nope')
  })

  it('renders an SVG card with escaped messages', () => {
    const svg = renderErrorSVG('<script>', 'secondary & text')
    expect(svg).toContain('<svg')
    expect(svg).toContain('&lt;script&gt;')
    expect(svg).not.toContain('<script>')
    expect(svg).toContain('secondary &amp; text')
  })

  it('omits the secondary line when absent', () => {
    expect(renderErrorSVG('only').split('<text').length).toBe(3) // header + message only
  })
})

describe('MemoryCache', () => {
  it('stores and retrieves values', async () => {
    const c = new MemoryCache()
    await c.set('k', 'v', 60)
    expect(await c.get('k')).toBe('v')
  })

  it('misses unknown keys and expired entries', async () => {
    const c = new MemoryCache()
    expect(await c.get('nope')).toBeNull()
    await c.set('exp', 'v', -1)
    expect(await c.get('exp')).toBeNull()
  })

  it('overwrites previous values', async () => {
    const c = new MemoryCache()
    await c.set('k', 'a', 60)
    await c.set('k', 'b', 60)
    expect(await c.get('k')).toBe('b')
  })
})

describe('themes', () => {
  it('defines the documented themes with all five colors', () => {
    for (const name of ['default', 'dark', 'radical', 'tokyonight', 'dracula', 'gruvbox', 'onedark', 'transparent']) {
      expect(themes[name]).toBeDefined()
      for (const key of ['title', 'text', 'icon', 'bg', 'border']) {
        expect(themes[name][key as keyof (typeof themes)['default']]).toMatch(/^[0-9a-f]{3,8}$/i)
      }
    }
  })
})
