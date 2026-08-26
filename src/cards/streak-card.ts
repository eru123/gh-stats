import { StreakData, StreakOptions, StreakRange } from '../types'
import { themes } from '../themes'
import { escapeHtml, clamp } from '../utils/svg'

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const DAYS_LONG    = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

// flame color per theme when not set explicitly — stays fire-toned across themes
const FIRE_COLORS: Record<string, string> = {
  default:     'ff6e96',
  dark:        'ff6e96',
  radical:     'fe428e',
  tokyonight:  'f7768e',
  dracula:     'ff6e96',
  gruvbox:     'fabd2f',
  onedark:     'e4bf7a',
  transparent: 'ff6e96',
}

const DEFAULT_DATE_FORMAT = 'M j[, Y]'

// ── PHP-style date formatting (subset used by streak-stats) ───────────────────

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th'
  return ['th', 'st', 'nd', 'rd'][n % 10] || 'th'
}

function renderDateTokens(fmt: string, iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dw = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  let out = ''
  for (let i = 0; i < fmt.length; i++) {
    switch (fmt[i]) {
      case '\\': out += fmt[++i] || ''; break
      case 'd': out += String(d).padStart(2, '0'); break
      case 'j': out += d; break
      case 'D': out += DAYS_SHORT[dw]; break
      case 'l': out += DAYS_LONG[dw]; break
      case 'S': out += ordinal(d); break
      case 'n': out += m; break
      case 'm': out += String(m).padStart(2, '0'); break
      case 'M': out += MONTHS_SHORT[m - 1]; break
      case 'F': out += MONTHS_LONG[m - 1]; break
      case 'Y': out += y; break
      case 'y': out += String(y).slice(2); break
      default:  out += fmt[i]
    }
  }
  return out
}

/**
 * Formats a YYYY-MM-DD date. PHP-style tokens: d j D l S n m M F Y y.
 * Text in [brackets] is only rendered when the date's year differs from the
 * current year — same behavior as github-readme-streak-stats.
 */
export function formatDate(iso: string, fmt: string, currentYear: number): string {
  let out = ''
  let i = 0
  while (i < fmt.length) {
    const c = fmt[i]
    if (c === '\\') { out += fmt[i + 1] || ''; i += 2; continue }
    if (c === '[') {
      const close = fmt.indexOf(']', i)
      const inner = fmt.slice(i + 1, close === -1 ? fmt.length : close)
      const year = parseInt(iso.slice(0, 4))
      if (year !== currentYear) out += renderDateTokens(inner, iso)
      i = close === -1 ? fmt.length : close + 1
      continue
    }
    out += renderDateTokens(c, iso)
    i++
  }
  return out
}

function formatDateLocale(iso: string, locale: string, currentYear: number): string {
  const year = parseInt(iso.slice(0, 4))
  try {
    const parts = new Intl.DateTimeFormat(locale, {
      month: 'short', day: 'numeric',
      ...(year !== currentYear ? { year: 'numeric' } : {}),
    }).formatToParts(new Date(iso + 'T00:00:00Z'))
    return parts.map(p => p.value).join('').replace(/\u200e/g, '').replace(/,/g, ', ')
      .replace(/\s+/g, ' ').trim()
  } catch {
    return formatDate(iso, DEFAULT_DATE_FORMAT, currentYear)
  }
}

// ── color helpers ─────────────────────────────────────────────────────────────

function hex(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback
  const v = raw.replace(/^#/, '').trim()
  return /^[0-9a-f]{3,8}$/i.test(v) ? v : fallback
}

function rangeText(range: StreakRange, fmt: string, currentYear: number, locale?: string): string {
  if (!range.start || !range.end || range.length === 0) return ''
  const fmtFn = (d: string) =>
    locale && fmt === DEFAULT_DATE_FORMAT
      ? formatDateLocale(d, locale, currentYear)
      : formatDate(d, fmt, currentYear)
  return `${fmtFn(range.start)} - ${fmtFn(range.end)}`
}

const CURRENT_YEAR = new Date().getUTCFullYear()

export function renderStreakCard(data: StreakData, options: StreakOptions): string {
  const theme = themes[options.theme || 'default'] || themes.default

  // precedence: upstream-specific param → gh-stats common param → theme
  const background    = hex(options.background,    hex(options.bg_color,    theme.bg))
  const border        = hex(options.border,        hex(options.border_color, theme.border))
  const ringColor     = hex(options.ring,          theme.border)
  const strokeColor   = hex(options.stroke,        theme.border)
  const fireColor     = hex(options.fire,          FIRE_COLORS[options.theme || 'default'] || 'ff6e96')
  const currStreakNum = hex(options.currStreakNum, hex(options.text_color, theme.title))
  const sideNums      = hex(options.sideNums,      hex(options.text_color, theme.text))
  const currStreakLbl = hex(options.currStreakLabel, hex(options.text_color, theme.text))
  const sideLabels    = hex(options.sideLabels,    hex(options.text_color, theme.text))
  const datesColor    = hex(options.dates,         hex(options.text_color, theme.text))

  const width = clamp(options.card_width || 495, 320, 800)
  const titleText = options.custom_title || `${options.username || ''} GitHub Streak`.trim()
  // upstream streak cards have no title — opt-in with hide_title=false
  const showTitle = options.hide_title === false
  const titleHeight = showTitle ? 30 : 0
  const height = 195 + titleHeight

  const fmt = options.date_format || DEFAULT_DATE_FORMAT
  const leftX = Math.round(width * 0.213)
  const midX = Math.round(width / 2)
  const rightX = Math.round(width * 0.787)

  const fmtNum = (n: number) => new Intl.NumberFormat('en-US').format(n)

  const leftColumn = `
    <text x="${leftX}" y="${titleHeight + 72}" font-size="28" font-weight="bold" text-anchor="middle" fill="#${sideNums}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${fmtNum(data.totalContributions)}</text>
    <text x="${leftX}" y="${titleHeight + 99}" font-size="14" text-anchor="middle" fill="#${sideLabels}" font-family="'Segoe UI', Ubuntu, Sans-Serif">Total Contributions</text>
    <text x="${leftX}" y="${titleHeight + 124}" font-size="12" text-anchor="middle" fill="#${datesColor}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${data.startingYear ? escapeHtml(`${data.startingYear} - Present`) : ''}</text>`

  const currentRange = rangeText(data.currentStreak, fmt, CURRENT_YEAR, options.locale)
  const centerColumn = `
    <g transform="translate(${midX}, ${titleHeight + 72})">
      <circle r="42" fill="#${ringColor}" stroke="#${strokeColor}" stroke-width="1"/>
      <g transform="translate(0, -14) scale(1.15)">
        <path d="M12 1.5C13.8 4.6 17.5 7.2 17.5 12a5.5 5.5 0 0 1-11 0c0-2.2 1.1-3.6 2.3-4.9.3.9.7 1.5 1.4 1.9-.2-2.6.5-5.4 1.8-7.5z" fill="#${fireColor}" transform="translate(-12,-12)"/>
        <path d="M12 8c.9 1.5 2.5 2.8 2.5 4.8a2.5 2.5 0 0 1-5 0c0-1.2.6-1.9 1.2-2.6.2.6.5 1 .9 1.2C11.1 10.2 11.6 9 12 8z" fill="#${strokeColor}" opacity="0.45" transform="translate(-12,-12)"/>
      </g>
      <text y="21" font-size="26" font-weight="bold" text-anchor="middle" fill="#${currStreakNum}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${fmtNum(data.currentStreak.length)}</text>
    </g>
    <text x="${midX}" y="${titleHeight + 140}" font-size="14" text-anchor="middle" fill="#${currStreakLbl}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${data.mode === 'weekly' ? 'Current Streak (weeks)' : 'Current Streak'}</text>
    <text x="${midX}" y="${titleHeight + 164}" font-size="12" text-anchor="middle" fill="#${datesColor}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${escapeHtml(currentRange)}</text>`

  const longestRange = rangeText(data.longestStreak, fmt, CURRENT_YEAR, options.locale)
  const rightColumn = `
    <text x="${rightX}" y="${titleHeight + 72}" font-size="28" font-weight="bold" text-anchor="middle" fill="#${sideNums}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${fmtNum(data.longestStreak.length)}</text>
    <text x="${rightX}" y="${titleHeight + 99}" font-size="14" text-anchor="middle" fill="#${sideLabels}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${data.mode === 'weekly' ? 'Longest Streak (weeks)' : 'Longest Streak'}</text>
    <text x="${rightX}" y="${titleHeight + 124}" font-size="12" text-anchor="middle" fill="#${datesColor}" font-family="'Segoe UI', Ubuntu, Sans-Serif">${escapeHtml(longestRange)}</text>`

  const borderOpt = options.hide_border ? '' : `stroke="#${border}"`
  const animStyles = options.disable_animations ? '' : `
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.5s ease-in-out; }`
  const wrapOpen = options.disable_animations ? '<g>' : '<g class="fade-in">'

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>${animStyles}</style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.border_radius ?? 4.5}" fill="#${background}" ${borderOpt}/>
  ${wrapOpen}
    ${showTitle ? `<text x="25" y="35" font-family="'Segoe UI', Ubuntu, Sans-Serif" font-size="18" font-weight="600" fill="#${hex(options.title_color, theme.title)}">${escapeHtml(titleText)}</text>` : ''}
    ${leftColumn}
    ${centerColumn}
    ${rightColumn}
  </g>
</svg>`
}
