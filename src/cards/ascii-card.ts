import { AsciiOptions } from '../types'
import { themes } from '../themes'
import { FONT, FONT_ROWS, FONT_COLS } from '../utils/font'

const FALLBACK = '0'.repeat(FONT_ROWS * FONT_COLS)

const SIZE_PRESETS = {
  sm: { block_w:  10, block_h:  7, gap: 2, char_spacing:  6 },
  md: { block_w:  18, block_h: 12, gap: 3, char_spacing: 10 },
  lg: { block_w:  24, block_h: 16, gap: 4, char_spacing: 14 },
  xl: { block_w:  32, block_h: 22, gap: 5, char_spacing: 18 },
}

export function renderAsciiCard(text: string, options: AsciiOptions): string {
  const theme = themes[options.theme || 'default'] || themes.default

  const blockColor  = options.color        || options.title_color  || theme.title
  const bgColor     = options.bg_color     || theme.bg
  const borderColor = options.border_color || theme.border
  const style       = options.style        || 'block'

  // Size preset — individual params override preset values
  const sizeKey = (options.size ?? 'md') as keyof typeof SIZE_PRESETS
  const preset = SIZE_PRESETS[sizeKey] ?? SIZE_PRESETS.md
  const blockW      = Math.max(1, options.block_w      ?? preset.block_w)
  const blockH      = Math.max(1, options.block_h      ?? preset.block_h)
  const gap         = Math.max(0, options.gap           ?? preset.gap)
  const charSpacing = Math.max(0, options.char_spacing  ?? preset.char_spacing)
  const blockRadius = Math.max(0, options.block_radius  ?? 2)
  const padding     = 20

  const charW = FONT_COLS * blockW + (FONT_COLS - 1) * gap
  const charH = FONT_ROWS * blockH + (FONT_ROWS - 1) * gap

  const chars = text.toUpperCase().split('')
  const svgW = chars.length * charW + Math.max(0, chars.length - 1) * charSpacing + padding * 2
  const svgH = charH + padding * 2

  const borderOpt = options.hide_border ? '' : `stroke="#${borderColor}"`

  let shadowRects = ''
  let mainRects   = ''

  chars.forEach((char, ci) => {
    const bitmap  = FONT[char] ?? FALLBACK
    const originX = padding + ci * (charW + charSpacing)

    for (let row = 0; row < FONT_ROWS; row++) {
      for (let col = 0; col < FONT_COLS; col++) {
        if (bitmap[row * FONT_COLS + col] !== '1') continue

        const x = originX + col * (blockW + gap)
        const y = padding  + row * (blockH + gap)
        const rx = `rx="${blockRadius}"`

        if (style === 'outline') {
          mainRects += `<rect x="${x}" y="${y}" width="${blockW}" height="${blockH}" ${rx} fill="none" stroke="#${blockColor}" stroke-width="1.5"/>`
        } else if (style === 'shadow') {
          const dx = Math.ceil(blockW * 0.25)
          const dy = Math.ceil(blockH * 0.25)
          shadowRects += `<rect x="${x + dx}" y="${y + dy}" width="${blockW}" height="${blockH}" ${rx} fill="#${blockColor}" opacity="0.25"/>`
          mainRects   += `<rect x="${x}" y="${y}" width="${blockW}" height="${blockH}" ${rx} fill="#${blockColor}"/>`
        } else {
          // block and neon both use solid fill; glow is applied via SVG filter on the group
          mainRects += `<rect x="${x}" y="${y}" width="${blockW}" height="${blockH}" ${rx} fill="#${blockColor}"/>`
        }
      }
    }
  })

  const glowSize = Math.max(2, Math.floor(blockW / 5))
  const defs = style === 'neon'
    ? `<defs><filter id="neon-glow" x="-40%" y="-40%" width="180%" height="180%">` +
      `<feGaussianBlur stdDeviation="${glowSize}" result="blur"/>` +
      `<feMerge><feMergeNode in="blur"/><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>` +
      `</filter></defs>`
    : ''

  const groupExtra = style === 'neon' ? ' filter="url(#neon-glow)"' : ''

  return `<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .fade-in { animation: fadeIn 0.5s ease-in-out; }
  </style>
  ${defs}
  <rect x="0.5" y="0.5" width="${svgW - 1}" height="${svgH - 1}" rx="${options.border_radius ?? 4.5}" fill="#${bgColor}" ${borderOpt}/>
  <g class="fade-in"${groupExtra}>${shadowRects}${mainRects}</g>
</svg>`
}
