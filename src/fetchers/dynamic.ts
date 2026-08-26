// Dynamic badge formatter — native replacement for shields' /badge/dynamic/json
// Fetches a JSON endpoint and extracts a value with a jq-style subset query.

import { CustomError } from '../utils/errors'

/**
 * Evaluates a jq-style subset against parsed JSON:
 *   $.foo.bar          nested keys
 *   $.foo[0].bar       array index
 *   $.[0]              root array index
 *   $.foo['bar key']   bracketed keys
 */
export function queryJson(data: unknown, query: string): unknown {
  const normalized = query.trim().replace(/^\$\.?/, '')
  if (!normalized) return data

  const tokens: Array<{ key: string } | { index: number }> = []
  const tokenRe = /\.?([^.[\]]+)|\[(\d+)\]|\['([^']*)'\]|\"([^\"]*)\"/g
  let pos = 0
  let matched = normalized.length > 0
  while (pos < normalized.length) {
    tokenRe.lastIndex = pos
    const m = tokenRe.exec(normalized)
    if (!m || m.index !== pos) { matched = false; break }
    if (m[1] !== undefined) tokens.push({ key: m[1] })
    else if (m[2] !== undefined) tokens.push({ index: parseInt(m[2]) })
    else if (m[3] !== undefined) tokens.push({ key: m[3] })
    else if (m[4] !== undefined) tokens.push({ key: m[4] })
    pos = tokenRe.lastIndex
  }
  if (!matched) {
    throw new CustomError(`Unsupported query syntax: "${query}" — use paths like $.a.b[0].c`, 'SERVER_ERROR')
  }

  let current: unknown = data
  for (const token of tokens) {
    if ('key' in token) {
      if (current === null || typeof current !== 'object') {
        throw new CustomError(`Query path "${query}" tried to read key "${token.key}" of a non-object`, 'SERVER_ERROR')
      }
      current = (current as Record<string, unknown>)[token.key]
    } else {
      if (!Array.isArray(current)) {
        throw new CustomError(`Query path "${query}" tried to index a non-array`, 'SERVER_ERROR')
      }
      current = current[token.index]
    }
    if (current === undefined) {
      throw new CustomError(`Query path "${query}" not found in JSON`, 'SERVER_ERROR')
    }
  }
  return current
}

export function stringifyQueryResult(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  }
  if (typeof value === 'boolean') return value.toString()
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

export async function fetchDynamicJson(url: string, maxBytes = 512 * 1024): Promise<unknown> {
  if (!/^https?:\/\//i.test(url)) {
    throw new CustomError('The url parameter must be an absolute http(s) URL', 'SERVER_ERROR')
  }

  const res = await fetch(url, {
    headers: { 'User-Agent': 'gh-stats', 'Accept': 'application/json' },
  }).catch(() => {
    throw new CustomError('Could not fetch the url parameter', 'NETWORK_ERROR')
  })

  if (!res.ok) {
    throw new CustomError(`Source responded with HTTP ${res.status}`, 'SERVER_ERROR')
  }

  const text = await res.text()
  if (text.length > maxBytes) {
    throw new CustomError('Source document exceeds the 512 KB limit', 'SERVER_ERROR')
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new CustomError('Source did not return valid JSON', 'SERVER_ERROR')
  }
}
