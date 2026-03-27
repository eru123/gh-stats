export function formatNumber(n: number, format: 'short' | 'long' = 'short'): string {
  if (format === 'long') {
    return new Intl.NumberFormat('en-US').format(n)
  }
  if (n < 1000) return n.toString()
  if (n < 1000000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M'
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max)
}
