// Icon resolution for badges — mirrors custom-icon-badges' architecture:
// 1. data URI passthrough (logo=data:image/svg+xml;base64,...)
// 2. custom icons from a GitHub repo (icons/<slug>.svg) — set ICON_REPO
// 3. GitHub octicons (primer) — fills, recolorable
// 4. simple-icons set — brand icons
// Whatever resolves is returned as a base64 data URI, optionally recolored.

import { MemoryCache } from '../utils/cache'

const iconCache = new MemoryCache()
const ICON_TTL = 86400 // 24h

function customIconBase(iconRepo?: string): string {
  if (iconRepo && /^https?:\/\//.test(iconRepo)) return iconRepo.replace(/\/$/, '')
  const repo = iconRepo || 'eru123/gh-stats'
  return `https://raw.githubusercontent.com/${repo}/main/icons`
}

async function fetchSvg(url: string): Promise<string | null> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'gh-stats', 'Accept': 'image/svg+xml' },
  }).catch(() => null)
  if (!res || !res.ok) return null
  const body = await res.text().catch(() => null)
  if (!body || !body.trim().startsWith('<svg')) return null
  return body
}

// latin1-safe base64 for SVG strings (btoa alone throws on non-ASCII)
function svgToDataUri(svg: string): string {
  const bytes = new TextEncoder().encode(svg)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return `data:image/svg+xml;base64,${btoa(bin)}`
}

/** injects a color into an SVG icon — fill for solid icons, stroke for feather */
function recolor(svg: string, hexColor: string): string {
  const isStrokeBased = /stroke=/.test(svg) && /feather|stroke-width/i.test(svg)
  const attr = isStrokeBased ? `stroke="#${hexColor}" fill="none"` : `fill="#${hexColor}"`
  return svg.replace(/<svg\b/, `<svg ${attr}`)
}

export async function resolveIcon(
  logo: string | undefined,
  options: { logoColor?: string; iconRepo?: string }
): Promise<string | undefined> {
  if (!logo) return undefined

  // passthrough data URIs
  if (logo.startsWith('data:image/')) return logo

  const slug = logo.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!slug) return undefined

  const color = options.logoColor?.replace(/^#/, '')
  const cacheKey = `icon:${slug}:${color || 'default'}:${options.iconRepo || 'default'}`
  const cached = await iconCache.get(cacheKey)
  if (cached) return cached

  const sources = [
    `${customIconBase(options.iconRepo)}/${slug}.svg`,
    `https://unpkg.com/@primer/octicons@19/build/svg/${slug}-16.svg`,
    `https://cdn.jsdelivr.net/npm/simple-icons@13/icons/${slug}.svg`,
  ]

  for (const url of sources) {
    const svg = await fetchSvg(url)
    if (svg) {
      const colored = color && /^[0-9a-f]{3,8}$/i.test(color) ? recolor(svg, color) : svg
      const data = svgToDataUri(colored)
      await iconCache.set(cacheKey, data, ICON_TTL)
      return data
    }
  }
  return undefined
}
