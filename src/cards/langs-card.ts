import { LangData, LangsOptions } from '../types'
import { themes } from '../themes'
import { escapeHtml } from '../utils/svg'

export function renderLangsCard(stats: LangData, options: LangsOptions): string {
  const theme = themes[options.theme || 'default'] || themes.default

  const titleColor = options.title_color || theme.title
  const textColor = options.text_color || theme.text
  const bgColor = options.bg_color || theme.bg
  const borderColor = options.border_color || theme.border
  
  const titleText = options.custom_title || `Most Used Languages`
  
  const langs = Object.keys(stats).map(name => ({
    name,
    color: stats[name].color,
    size: stats[name].size
  }))
  
  const totalSize = langs.reduce((acc, l) => acc + l.size, 0) || 1
  const layout = options.layout || 'normal'
  
  let width = 300
  let height = 75 + langs.length * 25
  let content = ''

  if (layout === 'compact') {
    width = 350
    const cols = 2
    const rows = Math.ceil(langs.length / cols)
    height = 70 + rows * 20
    
    content = langs.map((lang, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      const percent = ((lang.size / totalSize) * 100).toFixed(1)
      const x = col * 150
      const y = row * 20
      return `
        <g transform="translate(${x}, ${y})">
          <circle cx="5" cy="-4" r="5" fill="${lang.color}"/>
          <text x="15" y="0" class="lang-name" font-weight="bold">${escapeHtml(lang.name)}</text>
          <text x="110" y="0" class="lang-name">${percent}%</text>
        </g>
      `
    }).join('')
  } else if (layout === 'donut' || layout === 'pie') {
    width = 350
    height = 200
    let currentAngle = 0
    let paths = ''
    
    // Minimal simplistic SVG pie/donut generator
    langs.forEach(lang => {
      const portion = lang.size / totalSize
      if (portion === 0) return
      
      const angle = portion * Math.PI * 2
      const x1 = Math.cos(currentAngle) * 50
      const y1 = Math.sin(currentAngle) * 50
      
      currentAngle += angle
      
      const x2 = Math.cos(currentAngle) * 50
      const y2 = Math.sin(currentAngle) * 50
      const largeArc = portion > 0.5 ? 1 : 0
      
      if (portion === 1) {
        paths += `<circle cx="50" cy="50" r="50" fill="${lang.color}"/>`
      } else {
        paths += `<path d="M 50 50 L ${50 + x1} ${50 + y1} A 50 50 0 ${largeArc} 1 ${50 + x2} ${50 + y2} Z" fill="${lang.color}"/>`
      }
    })

    const legend = langs.map((lang, i) => {
      const percent = ((lang.size / totalSize) * 100).toFixed(1)
      return `
        <g transform="translate(130, ${i * 20})">
          <circle cx="5" cy="-4" r="5" fill="${lang.color}"/>
          <text x="15" y="0" class="lang-name" font-weight="bold">${escapeHtml(lang.name)}</text>
          <text x="110" y="0" class="lang-name">${percent}%</text>
        </g>
      `
    }).join('')

    content = `
      <g transform="translate(20, 20)">
        ${paths}
        ${layout === 'donut' ? `<circle cx="50" cy="50" r="30" fill="#${bgColor}"/>` : ''}
      </g>
      <g transform="translate(20, 40)">
        ${legend}
      </g>
    `
  } else {
    // Normal layout
    content = langs.map((lang, i) => {
      const percent = ((lang.size / totalSize) * 100).toFixed(1)
      return `
        <g transform="translate(0, ${i * 25})">
          <circle cx="5" cy="-4" r="5" fill="${lang.color}"/>
          <text x="20" y="0" class="lang-name" font-weight="bold">${escapeHtml(lang.name)}</text>
          <text x="180" y="0" class="lang-name">${percent}%</text>
          ${options.hide_progress ? '' : `
            <rect x="20" y="8" width="180" height="4" rx="2" fill="#${borderColor}" opacity="0.5"/>
            <rect x="20" y="8" width="${180 * (lang.size / totalSize)}" height="4" rx="2" fill="${lang.color}"/>
          `}
        </g>
      `
    }).join('')
  }
  
  const borderOpt = options.hide_border ? '' : `stroke="#${borderColor}"`

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>
        .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${titleColor}; }
        .lang-name { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #${textColor}; }
      </style>
      <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="${options.border_radius ?? 4.5}" fill="#${bgColor}" ${borderOpt}/>
      ${options.hide_title ? '' : `<text x="25" y="35" class="header">${escapeHtml(titleText)}</text>`}
      
      <g transform="translate(25, ${options.hide_title ? 20 : 65})">
        ${content}
      </g>
    </svg>
  `.trim()
}
