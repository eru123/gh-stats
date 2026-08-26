import { TypingOptions } from '../types'
import { escapeHtml, clamp } from '../utils/svg'

// average advance width per character relative to font size — monospace fonts
// (the default) measure ~0.6em; the width param exists to fine-tune clipping
const CHAR_WIDTH_RATIO = 0.62

export function renderTypingCard(lines: string[], options: TypingOptions): string {
  const size = clamp(options.size || 20, 8, 100)
  const font = options.font || 'monospace'
  const color = options.color || '36BCF7'
  const background = options.background || '00000000'
  const letterSpacing = options.letterSpacing || 'normal'
  const duration = clamp(options.duration || 5000, 0, 60000)
  const pause = clamp(options.pause || 0, 0, 60000)
  const repeat = options.repeat !== false
  const multiline = options.multiline === true

  const visible = lines.filter(l => l.trim().length > 0)
  const lineHeight = Math.round(size * 1.25)
  const contentHeight = visible.length > 0 ? visible.length * lineHeight : lineHeight
  const height = options.height || Math.max(50, contentHeight + size)
  const width = options.width || 400

  const startY = options.vCenter
    ? Math.round((height - contentHeight) / 2 + size * 0.85)
    : Math.round(size * 1.5)

  const charW = size * CHAR_WIDTH_RATIO
  const textX = options.center ? Math.round(width / 2) : 4

  // type over `duration`, hold for `pause`, erase quickly, then next line
  const erase = Math.max(120, Math.round(duration * 0.25))
  const n = visible.length
  const slot = duration + pause + erase
  const cycle = Math.max(slot * n, 1)
  const animAttrs = `dur="${cycle}ms" ${repeat ? 'repeatCount="indefinite"' : 'fill="freeze"'}`

  const defs: string[] = []
  const textEls: string[] = []

  visible.forEach((line, i) => {
    const y = startY + i * lineHeight
    const textWidth = Math.round(line.length * charW + size)
    // clip from the left edge of the text so typing reveals left-to-right
    // regardless of text-anchor
    const rectX = options.center ? Math.round(width / 2 - textWidth / 2) : 0
    const rectY = y - Math.round(size * 1.1)
    const rectH = Math.round(size * 1.6)
    const slotStart = i * slot

    let rect: string
    if (multiline) {
      // once typed, a line stays visible for the rest of the cycle
      const t0 = (slotStart / cycle).toFixed(4)
      const t1 = ((slotStart + duration) / cycle).toFixed(4)
      rect = `<rect x="${rectX}" y="${rectY}" width="0" height="${rectH}">
        <animate attributeName="width" values="0;0;${textWidth};${textWidth}" keyTimes="0;${t0};${t1};1" ${animAttrs}/>
      </rect>`
    } else {
      // type → hold → erase → hidden until this line's next cycle slot
      const pairs: [number, string][] = [
        [slotStart, '0'],
        [slotStart + duration, `${textWidth}`],
        [slotStart + duration + pause, `${textWidth}`],
        [Math.min(slotStart + duration + pause + erase, cycle), '0'],
        [cycle, '0'],
      ]
      // SMIL keyTimes must be strictly increasing — drop collapsed pairs
      const times: number[] = [0]
      const values: string[] = ['0']
      for (const [t, v] of pairs) {
        const key = Math.min(+(t / cycle).toFixed(4), 1)
        if (key > times[times.length - 1]) {
          times.push(key)
          values.push(v)
        } else {
          values[values.length - 1] = v
        }
      }
      rect = `<rect x="${rectX}" y="${rectY}" width="0" height="${rectH}">
        <animate attributeName="width" values="${values.join(';')}" keyTimes="${times.join(';')}" ${animAttrs}/>
      </rect>`
    }

    defs.push(`<clipPath id="clip${i}">${rect}</clipPath>`)
    textEls.push(`<text x="${textX}" y="${y}" fill="#${color}" font-family="'${font}',monospace" font-size="${size}" letter-spacing="${letterSpacing}"${options.center ? ' text-anchor="middle"' : ''} clip-path="url(#clip${i})">${escapeHtml(line)}</text>`)
  })

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>${defs.join('\n')}</defs>
  <rect width="${width}" height="${height}" fill="#${background}"/>
  ${textEls.join('\n')}
</svg>`
}
