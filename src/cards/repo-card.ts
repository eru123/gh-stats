import { RepoData, RepoOptions } from '../types'
import { themes } from '../themes'
import { escapeHtml, formatNumber } from '../utils/svg'

export function renderRepoCard(repo: RepoData, options: RepoOptions): string {
  const theme = themes[options.theme || 'default'] || themes.default

  const titleColor = options.title_color || theme.title
  const textColor = options.text_color || theme.text
  const iconColor = options.icon_color || theme.icon
  const bgColor = options.bg_color || theme.bg
  const borderColor = options.border_color || theme.border
  
  const width = 400
  const height = 120
  
  const titleText = options.show_owner ? escapeHtml(repo.nameWithOwner) : escapeHtml(repo.name)
  const borderOpt = options.hide_border ? '' : `stroke="#${borderColor}"`
  
  const langColor = repo.primaryLanguage ? repo.primaryLanguage.color : '#4c71f2'
  const langName = repo.primaryLanguage ? repo.primaryLanguage.name : 'Unknown'

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${titleColor}; }
        .desc { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
        .stats { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
        .icon { fill: #${iconColor}; font-size: 14px; }
      </style>
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.border_radius ?? 4.5}" fill="#${bgColor}" ${borderOpt}/>
      <text x="25" y="35" class="header">📦 ${titleText}</text>
      
      <text x="25" y="60" class="desc">${escapeHtml(repo.description || 'No description provided.')}</text>
      
      <g transform="translate(25, 95)">
        <circle cx="5" cy="-4" r="5" fill="${langColor}"/>
        <text x="15" y="0" class="stats">${escapeHtml(langName)}</text>
        
        <text x="100" y="0" class="icon">⭐</text>
        <text x="120" y="0" class="stats">${formatNumber(repo.stargazers)}</text>
        
        <text x="170" y="0" class="icon">🍴</text>
        <text x="190" y="0" class="stats">${formatNumber(repo.forks)}</text>
      </g>
    </svg>
  `.trim()
}
