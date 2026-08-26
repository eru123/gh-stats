import { BadgeOptions, BadgeStyle } from '../types'
import { escapeHtml } from '../utils/svg'

// shields named colors
const NAMED_COLORS: Record<string, string> = {
  brightgreen: '44cc11', green: '97ca00', yellow: 'dfb317', yellowgreen: 'a4a61d',
  orange: 'fe7d37', red: 'e05d44', blue: '007ec6', grey: '555555', gray: '555555',
  lightgrey: '9f9f9f', lightgray: '9f9f9f', blueviolet: '8a2be2', pink: 'ff69b4',
  success: '97ca00', important: 'fe7d37', critical: 'e05d44',
  informational: '007ec6', inactive: '555555',
}

export function resolveColor(raw: string | null | undefined, fallback = '007ec6'): string {
  if (!raw) return fallback
  const v = raw.trim().replace(/^#/, '')
  if (NAMED_COLORS[v.toLowerCase()]) return NAMED_COLORS[v.toLowerCase()]
  if (/^[0-9a-f]{3,8}$/i.test(v)) return v
  return fallback
}

// average glyph width per font-size unit for Verdana-ish badge text
const CHAR_RATIO = 0.62

interface BadgeGeometry {
  height: number
  radius: number
  fontSize: number
  bold: boolean
  uppercase: boolean
  defaultLabelColor: string
  gradient: boolean
  letterSpacing: number
}

const STYLE_GEOMETRY: Record<BadgeStyle, BadgeGeometry> = {
  'flat':         { height: 20, radius: 3, fontSize: 11, bold: false, uppercase: false, defaultLabelColor: '555555', gradient: false, letterSpacing: 0 },
  'plastic':      { height: 18, radius: 3, fontSize: 11, bold: false, uppercase: false, defaultLabelColor: '555555', gradient: true,  letterSpacing: 0 },
  'flat-square':  { height: 20, radius: 0, fontSize: 11, bold: false, uppercase: false, defaultLabelColor: '555555', gradient: false, letterSpacing: 0 },
  'for-the-badge':{ height: 28, radius: 3, fontSize: 10, bold: true,  uppercase: true,  defaultLabelColor: '2b2b2b', gradient: false, letterSpacing: 1 },
  'social':       { height: 20, radius: 3, fontSize: 11, bold: false, uppercase: false, defaultLabelColor: 'f6f8fa', gradient: false, letterSpacing: 0 },
}

export function renderBadge(options: BadgeOptions): string {
  const style = options.style && STYLE_GEOMETRY[options.style] ? options.style : 'flat'
  const g = STYLE_GEOMETRY[style]

  const label = g.uppercase ? options.label.toUpperCase() : options.label
  const message = g.uppercase ? options.message.toUpperCase() : options.message

  const labelColor = options.labelColor || g.defaultLabelColor
  const messageColor = style === 'social' ? '24292f' : 'ffffff'

  const logoSize = g.height === 28 ? 18 : 14
  const logoW = options.logoData ? (options.logoWidth || logoSize) : 0

  const labelFontW = Math.round(label.length * g.fontSize * CHAR_RATIO) + (g.letterSpacing ? label.length * g.letterSpacing : 0)
  const messageFontW = Math.round(message.length * g.fontSize * CHAR_RATIO) + (g.letterSpacing ? message.length * g.letterSpacing : 0)

  const labelTextX = 8 + logoW + (logoW ? 4 : 0)
  const labelWidth = labelTextX + labelFontW + 6
  const messageTextX = labelWidth + 5 + (logoW && !label ? logoW + 4 : 0)
  const messageWidth = messageTextX + messageFontW + 6
  const width = Math.max(messageWidth, labelWidth + 4, 20)

  const y = Math.round(g.height / 2 + g.fontSize * 0.36)
  const logo = options.logoData
    ? `<image x="8" y="${Math.round((g.height - logoSize) / 2)}" width="${logoSize}" height="${logoSize}" href="${options.logoData}"/>`
    : ''

  const defs = g.gradient ? `
    <linearGradient id="smooth" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".25"/>
      <stop offset="1" stop-opacity=".25"/>
    </linearGradient>` : ''

  const gradientOverlay = g.gradient
    ? `<rect width="${width}" height="${g.height}" rx="${g.radius}" fill="url(#smooth)"/>`
    : ''

  // social style: label is a light pill with dark text; message pill is colored
  const labelTextFill = style === 'social' ? '#24292f' : '#ffffff'

  return `<svg width="${width}" height="${g.height}" viewBox="0 0 ${width} ${g.height}" xmlns="http://www.w3.org/2000/svg" role="img">
  <defs>${defs}</defs>
  ${label ? `<rect width="${labelWidth}" height="${g.height}" rx="${g.radius}" fill="#${labelColor}"/>` : ''}
  <rect x="${label ? labelWidth - (g.radius && label ? g.radius : 0) : 0}" width="${width - (label ? labelWidth - (g.radius ? g.radius : 0) : 0)}" height="${g.height}"${label && g.radius ? ` rx="${g.radius}"` : ''} fill="#${options.color}"/>
  ${gradientOverlay}
  ${logo}
  ${label ? `<text x="${labelTextX}" y="${y}" fill="#${labelTextFill}" font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="${g.fontSize}"${g.bold ? ' font-weight="bold"' : ''}${g.letterSpacing ? ` letter-spacing="${g.letterSpacing}"` : ''}>${escapeHtml(label)}</text>` : ''}
  <text x="${messageTextX}" y="${y}" fill="#${messageColor}" font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="${g.fontSize}"${g.bold ? ' font-weight="bold"' : ''}${g.letterSpacing ? ` letter-spacing="${g.letterSpacing}"` : ''}>${escapeHtml(message)}</text>
</svg>`
}
