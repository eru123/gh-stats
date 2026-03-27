import { RepoData, RepoOptions } from '../types'
import { themes } from '../themes'
import { escapeHtml, formatNumber } from '../utils/svg'

// Octicon 16x16 SVG paths
const ICONS = {
  package:
    'M8.878.392a1.75 1.75 0 0 0-1.756 0l-5.25 3.045A1.75 1.75 0 0 0 1 4.951v6.098c0 .624.332 1.2.872 1.514l5.25 3.045a1.75 1.75 0 0 0 1.756 0l5.25-3.045c.54-.313.872-.89.872-1.514V4.951c0-.624-.332-1.2-.872-1.514L8.878.392zM7.875 1.69a.25.25 0 0 1 .25 0l4.63 2.685L8 7.154 3.245 4.375l4.63-2.685zM2.5 5.677v5.372c0 .09.047.171.125.216l4.625 2.683V8.432L2.5 5.677zm6.25 8.271 4.625-2.683a.25.25 0 0 0 .125-.216V5.677L8.75 8.432v5.516z',
  star:
    'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.875 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z',
  fork:
    'M5 3.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm0 2.122a2.25 2.25 0 1 0-1.5 0v.878A2.25 2.25 0 0 0 5.75 8.5h1.5v2.128a2.251 2.251 0 1 0 1.5 0V8.5h1.5a2.25 2.25 0 0 0 2.25-2.25v-.878a2.25 2.25 0 1 0-1.5 0v.878a.75.75 0 0 1-.75.75h-4.5A.75.75 0 0 1 5 6.25v-.878zm3.75 7.378a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm3-8.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z',
}

export function renderRepoCard(repo: RepoData, options: RepoOptions): string {
  const theme = themes[options.theme || 'default'] || themes.default

  const titleColor  = options.title_color  || theme.title
  const textColor   = options.text_color   || theme.text
  const iconColor   = options.icon_color   || theme.icon
  const bgColor     = options.bg_color     || theme.bg
  const borderColor = options.border_color || theme.border

  const width = 400
  const height = 120

  const titleText = options.show_owner ? escapeHtml(repo.nameWithOwner) : escapeHtml(repo.name)
  const borderOpt = options.hide_border ? '' : `stroke="#${borderColor}"`

  const langColor = repo.primaryLanguage ? repo.primaryLanguage.color : '#4c71f2'
  const langName  = repo.primaryLanguage ? repo.primaryLanguage.name  : 'Unknown'

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.5s ease-in-out; }
    .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${titleColor}; }
    .desc   { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
    .stats  { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
  </style>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.border_radius ?? 4.5}" fill="#${bgColor}" ${borderOpt}/>
  <g class="fade-in">
    <svg x="25" y="19" width="14" height="14" viewBox="0 0 16 16"><path d="${ICONS.package}" fill="#${titleColor}"/></svg>
    <text x="47" y="35" class="header">${titleText}</text>

    <text x="25" y="60" class="desc">${escapeHtml(repo.description || 'No description provided.')}</text>

    <g transform="translate(25, 95)">
      <circle cx="5" cy="-4" r="5" fill="${langColor}"/>
      <text x="15" y="0" class="stats">${escapeHtml(langName)}</text>

      <svg x="98" y="-12" width="14" height="14" viewBox="0 0 16 16"><path d="${ICONS.star}" fill="#${iconColor}"/></svg>
      <text x="116" y="0" class="stats">${formatNumber(repo.stargazers)}</text>

      <svg x="164" y="-12" width="14" height="14" viewBox="0 0 16 16"><path d="${ICONS.fork}" fill="#${iconColor}"/></svg>
      <text x="182" y="0" class="stats">${formatNumber(repo.forks)}</text>
    </g>
  </g>
</svg>`
}
