import { GitHubStats, StatsOptions } from '../types'
import { themes } from '../themes'
import { escapeHtml, formatNumber } from '../utils/svg'

export function renderStatsCard(stats: GitHubStats, options: StatsOptions): string {
  const theme = themes[options.theme || 'default'] || themes.default

  const titleColor = options.title_color || theme.title
  const textColor = options.text_color || theme.text
  const iconColor = options.icon_color || theme.icon
  const bgColor = options.bg_color || theme.bg
  const borderColor = options.border_color || theme.border
  const rankRingColor = options.ring_color || titleColor
  
  const width = 450
  const titleText = options.custom_title || `${stats.name}'s GitHub Stats`
  
  const hideSet = new Set((options.hide || '').split(',').map(s => s.trim().toLowerCase()))

  const items = []
  if (!hideSet.has('stars')) items.push({ label: 'Total Stars', value: stats.totalStars, icon: '⭐' })
  if (!hideSet.has('commits')) items.push({ label: 'Total Commits', value: stats.totalCommits, icon: '🔥' })
  if (!hideSet.has('prs')) items.push({ label: 'Total PRs', value: stats.totalPRs, icon: '🔄' })
  if (!hideSet.has('issues')) items.push({ label: 'Total Issues', value: stats.totalIssues, icon: '🐛' })
  if (!hideSet.has('contribs')) items.push({ label: 'Contributed to', value: stats.totalReviews, icon: '📚' })
  
  const height = 100 + items.length * 25
  const borderOpt = options.hide_border ? '' : `stroke="#${borderColor}"`

  const rankHtml = options.hide_rank ? '' : `
    <g transform="translate(360, 40)">
      <circle cx="25" cy="25" r="25" fill="none" stroke="#${rankRingColor}" stroke-width="4"/>
      <text x="25" y="32" font-weight="bold" font-size="20" fill="#${titleColor}" text-anchor="middle">${stats.rank.level}</text>
    </g>
  `

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${titleColor}; }
        .stat { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
        .icon { fill: #${iconColor}; font-size: 14px; }
      </style>
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.border_radius ?? 4.5}" fill="#${bgColor}" ${borderOpt}/>
      ${options.hide_title ? '' : `<text x="25" y="35" class="header">${escapeHtml(titleText)}</text>`}
      
      <g transform="translate(25, 65)">
        ${items.map((item, i) => `
          <text x="0" y="${i * 25}" class="icon">${options.show_icons ? item.icon : ''}</text>
          <text x="${options.show_icons ? 25 : 0}" y="${i * 25}" transform="translate(0, 1)" class="stat">${escapeHtml(item.label)}</text>
          <text x="200" y="${i * 25}" transform="translate(0, 1)" font-weight="bold" class="stat">${formatNumber(item.value, options.number_format)}</text>
        `).join('')}
      </g>
      ${rankHtml}
    </svg>
  `.trim()
}
