import { escapeHtml } from './svg'

export class CustomError extends Error {
  constructor(message: string, public type: 'USER_NOT_FOUND' | 'RATE_LIMIT' | 'INVALID_TOKEN' | 'NETWORK_ERROR' | 'SERVER_ERROR') {
    super(message)
    this.name = 'CustomError'
  }
}

export function renderErrorSVG(message: string, secondaryMessage?: string): string {
  return `<svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
      .header { font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif; fill: #E5534B; }
      .text { font: 400 14px 'Segoe UI', Ubuntu, Sans-Serif; fill: #434d58; }
    </style>
    <rect x="0.5" y="0.5" width="399" height="119" rx="4.5" fill="#FFFEFE" stroke="#E4E2E2"/>
    <text x="25" y="35" class="header">⚠ Something went wrong</text>
    <text x="25" y="65" class="text">${escapeHtml(message)}</text>
    ${secondaryMessage ? `<text x="25" y="85" class="text">${escapeHtml(secondaryMessage)}</text>` : ''}
  </svg>`
}
