import { GitHubStats, StatsOptions } from '../types'
import { themes } from '../themes'
import { escapeHtml, formatNumber } from '../utils/svg'

// Octicon 16x16 SVG paths
const ICONS = {
  star:
    'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.875 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z',
  commit:
    'M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0z',
  pr:
    'M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854v4.792a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354zM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5zm-1.5 9.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0zm9.75 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0zm1.5-5.25a1 1 0 0 0-1-1h-2.5v1.5h2.5v4.878a2.251 2.251 0 1 0 1 0z',
  issue:
    'M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0z',
  followers:
    'M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5zM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5z',
  contribs:
    'M5 5.372v5.256a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0zm5.25-.183a1.5 1.5 0 1 0-1.5 0v.21a2.246 2.246 0 0 0 .5 4.44v.178a2.246 2.246 0 0 0 .5 4.44v.583a2.25 2.25 0 1 0 1.5 0v-.583a2.246 2.246 0 0 0 .5-4.44v-.178a2.247 2.247 0 0 0 .5-4.44v-.21zM8.5 2.5a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0zm.75 9.5a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zM4.25 12a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5zM3.5 3.25a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z',
}

const RANK_RADIUS = 25
const RANK_CIRCUMFERENCE = +(2 * Math.PI * RANK_RADIUS).toFixed(2)

export function renderStatsCard(stats: GitHubStats, options: StatsOptions): string {
  const theme = themes[options.theme || 'default'] || themes.default

  const titleColor   = options.title_color  || theme.title
  const textColor    = options.text_color   || theme.text
  const iconColor    = options.icon_color   || theme.icon
  const bgColor      = options.bg_color     || theme.bg
  const borderColor  = options.border_color || theme.border
  const rankRingColor = options.ring_color  || titleColor

  const width = 450
  const titleText = options.custom_title || `${stats.name}'s GitHub Stats`

  const hideSet = new Set((options.hide || '').split(',').map(s => s.trim().toLowerCase()))

  const items: { label: string; value: number; iconPath: string }[] = []
  if (!hideSet.has('stars'))     items.push({ label: 'Total Stars',    value: stats.totalStars,   iconPath: ICONS.star })
  if (!hideSet.has('commits'))   items.push({ label: 'Total Commits',  value: stats.totalCommits, iconPath: ICONS.commit })
  if (!hideSet.has('prs'))       items.push({ label: 'Total PRs',      value: stats.totalPRs,     iconPath: ICONS.pr })
  if (!hideSet.has('issues'))    items.push({ label: 'Total Issues',   value: stats.totalIssues,  iconPath: ICONS.issue })
  if (!hideSet.has('followers')) items.push({ label: 'Followers',      value: stats.followers,    iconPath: ICONS.followers })
  if (!hideSet.has('contribs'))  items.push({ label: 'Contributed to', value: stats.totalReviews, iconPath: ICONS.contribs })

  const height = 100 + items.length * 25
  const borderOpt = options.hide_border ? '' : `stroke="#${borderColor}"`

  const rankBadge = options.hide_rank ? '' : `
    <g transform="translate(360, 15)">
      <circle cx="25" cy="25" r="${RANK_RADIUS}" fill="none" stroke="#${borderColor}" stroke-width="4" opacity="0.3"/>
      <circle cx="25" cy="25" r="${RANK_RADIUS}" fill="none"
        stroke="#${rankRingColor}" stroke-width="4"
        stroke-dasharray="${RANK_CIRCUMFERENCE}"
        stroke-dashoffset="${RANK_CIRCUMFERENCE}"
        transform="rotate(-90 25 25)"
        class="rank-ring"/>
      <text x="25" y="32" font-weight="bold" font-size="20" fill="#${titleColor}" text-anchor="middle">${stats.rank.level}</text>
    </g>`

  const statsRows = items.map((item, i) => {
    const y = i * 25
    const icon = options.show_icons
      ? `<svg x="0" y="${y - 11}" width="14" height="14" viewBox="0 0 16 16"><path d="${item.iconPath}" fill="#${iconColor}"/></svg>`
      : ''
    const labelX = options.show_icons ? 20 : 0
    return `${icon}
          <text x="${labelX}" y="${y}" transform="translate(0,1)" class="stat">${escapeHtml(item.label)}</text>
          <text x="200" y="${y}" transform="translate(0,1)" font-weight="bold" class="stat">${formatNumber(item.value, options.number_format)}</text>`
  }).join('\n')

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes rankAnimation { from { stroke-dashoffset: ${RANK_CIRCUMFERENCE}; } to { stroke-dashoffset: 0; } }
    .fade-in { animation: fadeIn 0.5s ease-in-out; }
    .rank-ring { animation: rankAnimation 1s ease-in-out forwards; }
    .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${titleColor}; }
    .stat   { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
  </style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.border_radius ?? 4.5}" fill="#${bgColor}" ${borderOpt}/>
  <g class="fade-in">
    ${options.hide_title ? '' : `<text x="25" y="35" class="header">${escapeHtml(titleText)}</text>`}
    <g transform="translate(25, 65)">
      ${statsRows}
    </g>
    ${rankBadge}
  </g>
</svg>`
}
