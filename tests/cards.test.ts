import { describe, it, expect } from 'vitest'
import { renderTypingCard } from '../src/cards/typing-card'
import { renderBadge, resolveColor } from '../src/cards/badge-card'
import { queryJson, stringifyQueryResult } from '../src/fetchers/dynamic'
import { renderVideosCard } from '../src/cards/videos-card'

describe('renderTypingCard', () => {
  it('renders one text element per line with clip paths', () => {
    const svg = renderTypingCard(['Hello', 'World'], {})
    expect(svg).toContain('<svg')
    expect((svg.match(/<text /g) || []).length).toBe(2)
    expect((svg.match(/clipPath/g) || []).length).toBeGreaterThanOrEqual(2)
    expect(svg).toContain('36BCF7') // default color
  })

  it('escapes line content', () => {
    const svg = renderTypingCard(['<script>&'], {})
    expect(svg).toContain('&lt;script&gt;')
    expect(svg).not.toContain('<script>')
  })

  it('uses custom colors, size, font and animation timings', () => {
    const svg = renderTypingCard(['x'], {
      color: 'ff6e96', background: '151515', size: 30,
      font: 'Fira Code', duration: 2000, pause: 500,
    })
    expect(svg).toContain('fill="#ff6e96"')
    expect(svg).toContain('fill="#151515"')
    expect(svg).toContain('font-size="30"')
    expect(svg).toContain("'Fira Code',monospace")
    // cycle = duration + pause + erase(max(120, duration*0.25)=500) for one line
    expect(svg).toContain('dur="3000ms"')
  })

  it('drops empty lines and skips repeat when repeat=false', () => {
    const svg = renderTypingCard(['a', '  ', 'b'], { repeat: false })
    expect((svg.match(/<text /g) || []).length).toBe(2)
    expect(svg).toContain('fill="freeze"')
    expect(svg).not.toContain('repeatCount')
  })

  it('produces strictly increasing keyTimes even with zero pause', () => {
    const svg = renderTypingCard(['one', 'two', 'three'], { duration: 1000, pause: 0 })
    const keyTimes = [...svg.matchAll(/keyTimes="([^"]+)"/g)].map(m =>
      m[1].split(';').map(Number)
    )
    for (const times of keyTimes) {
      for (let i = 1; i < times.length; i++) {
        expect(times[i]).toBeGreaterThan(times[i - 1])
      }
    }
  })
})

describe('renderBadge', () => {
  it('renders flat badge with label, message and colors', () => {
    const svg = renderBadge({ label: 'build', message: 'passing', color: '44cc11' })
    expect(svg).toContain('>build</text>')
    expect(svg).toContain('>passing</text>')
    expect(svg).toContain('fill="#44cc11"')
    expect(svg).toContain('fill="#555555"') // default label color
  })

  it('supports all five styles with their heights', () => {
    for (const [style, height] of [['flat', 20], ['plastic', 18], ['flat-square', 20], ['for-the-badge', 28], ['social', 20]] as const) {
      const svg = renderBadge({ label: 'a', message: 'b', color: 'blue', style })
      expect(svg).toContain(`height="${height}"`)
    }
  })

  it('uppercases and bolds for-the-badge', () => {
    const svg = renderBadge({ label: 'version', message: '1.0', color: 'blue', style: 'for-the-badge' })
    expect(svg).toContain('>VERSION</text>')
    expect(svg).toContain('font-weight="bold"')
  })

  it('embeds logo data uris and escapes text', () => {
    const svg = renderBadge({
      label: 'x', message: '<b>', color: 'red',
      logoData: 'data:image/svg+xml;base64,AAAA',
    })
    expect(svg).toContain('href="data:image/svg+xml;base64,AAAA"')
    expect(svg).toContain('&lt;b&gt;')
  })

  it('resolves named colors and passes hex through', () => {
    expect(resolveColor('brightgreen')).toBe('44cc11')
    expect(resolveColor('#ff6e96')).toBe('ff6e96')
    expect(resolveColor(undefined)).toBe('007ec6')
    expect(resolveColor(null, 'e05d44')).toBe('e05d44')
    expect(resolveColor('not-a-color')).toBe('007ec6')
  })
})

describe('queryJson', () => {
  const data = {
    version: '1.2.3',
    stable: true,
    count: 42,
    items: [{ name: 'first', score: 9.5 }, { name: 'second', score: 3 }],
    nested: { deep: { value: 'found' } },
  }

  it('navigates keys, arrays and brackets', () => {
    expect(queryJson(data, '$.version')).toBe('1.2.3')
    expect(queryJson(data, '$.items[1].name')).toBe('second')
    expect(queryJson(data, "$['nested']['deep'].value")).toBe('found')
    expect(queryJson(data, '$.nested.deep.value')).toBe('found')
  })

  it('stringifies numbers, booleans and floats', () => {
    expect(stringifyQueryResult(queryJson(data, '$.count'))).toBe('42')
    expect(stringifyQueryResult(queryJson(data, '$.stable'))).toBe('true')
    expect(stringifyQueryResult(queryJson(data, '$.items[0].score'))).toBe('9.50')
  })

  it('throws helpful errors on bad paths and syntax', () => {
    expect(() => queryJson(data, '$.missing')).toThrow(/not found/)
    expect(() => queryJson(data, '$.version.foo')).toThrow(/non-object/)
    expect(() => queryJson(data, '$.version[0]')).toThrow(/non-array/)
  })
})

describe('renderVideosCard', () => {
  const videos = [
    {
      id: 'a', title: 'Building a Worker in 5 Minutes', thumbnailData: 'data:image/jpeg;base64,AAA',
      publishedAt: new Date(Date.now() - 86400000 * 3).toISOString(), viewCount: 15400, channelTitle: 'test',
    },
    {
      id: 'b', title: 'A Very Long Video Title That Should Wrap Across Multiple Lines When max_title_lines Allows',
      thumbnailData: 'data:image/jpeg;base64,BBB',
      publishedAt: new Date(Date.now() - 86400000 * 40).toISOString(), viewCount: 2500000, channelTitle: 'test',
    },
  ]

  it('renders one card per video with views and relative dates', () => {
    const svg = renderVideosCard(videos, {})
    expect((svg.match(/<image /g) || []).length).toBe(videos.length)
    expect(svg).toContain('15K views')
    expect(svg).toContain('3 days ago')
    expect(svg).toContain('2.5M views')
    expect(svg).toContain('1 month ago')
  })

  it('wraps titles to max_title_lines', () => {
    const one = renderVideosCard(videos, { max_title_lines: 1 })
    const two = renderVideosCard(videos, { max_title_lines: 2 })
    const countLines = (svg: string) => (svg.match(/font-weight="600"/g) || []).length
    expect(countLines(one)).toBe(2) // one line per video
    expect(countLines(two)).toBeGreaterThan(2)
    expect(two).toContain('…') // truncated long title
  })

  it('scales with width and applies colors', () => {
    const svg = renderVideosCard(videos, {
      width: 300, background_color: '#0d1117', title_color: '#ffffff', stats_color: '#b0b3b6',
    })
    expect(svg).toContain('fill="#0d1117"')
    expect(svg).toContain('fill="#ffffff"')
    expect(svg).toContain('fill="#b0b3b6"')
  })
})
