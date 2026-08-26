import { VideoData, VideosOptions } from '../types'
import { escapeHtml, clamp } from '../utils/svg'

function formatViews(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M views'
  if (n >= 1_000) return (n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K views'
  return `${n} views`
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 3600) return `${Math.max(1, Math.floor(seconds / 60))} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  const days = Math.floor(seconds / 86400)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} ago`
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) === 1 ? '' : 's'} ago`
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) === 1 ? '' : 's'} ago`
}

// wraps text into at most maxLines lines of ~maxChars, breaking on spaces
function wrapTitle(title: string, maxLines: number, maxChars: number): string[] {
  const words = title.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if (!current) {
      current = word.slice(0, maxChars)
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ` ${word}`
    } else if (lines.length < maxLines - 1) {
      lines.push(current)
      current = word.slice(0, maxChars)
    } else {
      // last line — truncate with ellipsis if more text follows
      const wouldFit = `${current} ${word}`.length <= maxChars - 1
      current = wouldFit ? `${current} ${word}` : `${current.slice(0, maxChars - 1)}…`
      break
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, maxLines)
}

export function renderVideosCard(videos: VideoData[], options: VideosOptions): string {
  const width = clamp(options.width || 250, 150, 500)
  const radius = clamp(options.border_radius ?? 8, 0, 40)
  const bg = (options.background_color || 'ffffff').replace(/^#/, '')
  const titleColor = (options.title_color || '000000').replace(/^#/, '')
  const statsColor = (options.stats_color || '000000').replace(/^#/, '')
  const maxTitleLines = clamp(options.max_title_lines || 1, 1, 4)

  const gap = 16
  const thumbH = Math.round((width * 9) / 16)
  const titleFont = Math.max(11, Math.round(width / 21))
  const statsFont = Math.max(9, Math.round(width / 27))
  const textBlockH = 14 + maxTitleLines * (titleFont + 4) + statsFont + 14
  const cardH = thumbH + textBlockH

  const cards = videos.map((video, i) => {
    const x = i * (width + gap)
    const maxChars = Math.floor((width - 20) / (titleFont * 0.55))
    const lines = wrapTitle(video.title, maxTitleLines, maxChars)
    const titleEls = lines
      .map((line, li) => `<text x="${x + 10}" y="${thumbH + 16 + (li + 1) * (titleFont + 4)}" fill="#${titleColor}" font-family="'Segoe UI',Ubuntu,Arial,sans-serif" font-size="${titleFont}" font-weight="600">${escapeHtml(line)}</text>`)
      .join('\n')
    const statsY = thumbH + 16 + maxTitleLines * (titleFont + 4) + 6
    return `<g>
      <rect x="${x}" y="0" width="${width}" height="${cardH}" rx="${radius}" fill="#${bg}"/>
      <clipPath id="thumb${i}"><rect x="${x + radius}" y="${radius}" width="${width - radius * 2}" height="${thumbH - radius}"/></clipPath>
      <image x="${x}" y="0" width="${width}" height="${thumbH}" href="${video.thumbnailData}" clip-path="url(#thumb${i})" preserveAspectRatio="xMidYMin slice"/>
      ${titleEls}
      <text x="${x + 10}" y="${statsY + statsFont}" fill="#${statsColor}" font-family="'Segoe UI',Ubuntu,Arial,sans-serif" font-size="${statsFont}">${escapeHtml(`${formatViews(video.viewCount)} • ${timeAgo(video.publishedAt)}`)}</text>
    </g>`
  }).join('\n')

  const totalW = videos.length * width + (videos.length - 1) * gap
  return `<svg width="${totalW}" height="${cardH}" viewBox="0 0 ${totalW} ${cardH}" xmlns="http://www.w3.org/2000/svg">
  ${cards}
</svg>`
}
