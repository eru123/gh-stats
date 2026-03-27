import { fetchStats } from './fetchers/stats'
import { fetchTopLangs } from './fetchers/langs'
import { fetchRepo } from './fetchers/repo'
import { renderStatsCard } from './cards/stats-card'
import { renderLangsCard } from './cards/langs-card'
import { renderRepoCard } from './cards/repo-card'
import { renderAsciiCard } from './cards/ascii-card'
import { CustomError, renderErrorSVG } from './utils/errors'
import { MemoryCache, CfCache } from './utils/cache'

export interface AppRequest {
  url: string
  method: string
  env: {
    GITHUB_TOKEN: string
    CACHE_SECONDS?: string
    WHITELIST?: string
  }
}

export interface AppResponse {
  body: string
  status: number
  headers: Record<string, string>
}

const memCache = new MemoryCache()
const USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i

function isCloudflareEnv(_env: any): boolean {
  return (
    typeof (globalThis as any).caches !== 'undefined' &&
    typeof (globalThis as any).caches.default !== 'undefined'
  )
}

export async function handleRequest(req: AppRequest): Promise<AppResponse> {
  try {
    const url = new URL(req.url)
    const { pathname, searchParams } = url

    const defaultTTL =
      pathname === '/api/stats' || pathname === '/api/stats/' ? 21600 : 86400
    const cacheSeconds = req.env.CACHE_SECONDS
      ? parseInt(req.env.CACHE_SECONDS)
      : defaultTTL

    const cacheKey = url.toString()
    const cache = isCloudflareEnv(req.env) ? new CfCache() : memCache

    const cached = await cache.get(cacheKey)
    if (cached) {
      return {
        body: cached,
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
        },
      }
    }

    let body = ''

    // ── ASCII art card — no GitHub token required ────────────────────────────
    if (pathname === '/api/ascii') {
      const text = searchParams.get('text')
      if (!text || text.trim().length === 0) {
        throw new CustomError('Missing or empty text parameter', 'USER_NOT_FOUND')
      }
      // Strip control characters and limit length
      const safeText = text.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 50)

      body = renderAsciiCard(safeText, {
        theme:        searchParams.get('theme')        || undefined,
        title_color:  searchParams.get('title_color')  || undefined,
        bg_color:     searchParams.get('bg_color')     || undefined,
        border_color: searchParams.get('border_color') || undefined,
        hide_border:  searchParams.get('hide_border') === 'true',
        border_radius: searchParams.has('border_radius')
          ? parseFloat(searchParams.get('border_radius')!) : undefined,

        color:        searchParams.get('color')        || undefined,
        style:        (searchParams.get('style') || undefined) as 'block' | 'outline' | 'shadow' | 'neon' | undefined,
        size:         (searchParams.get('size')  || undefined) as 'sm' | 'md' | 'lg' | 'xl' | undefined,
        block_w:      searchParams.has('block_w')
          ? parseInt(searchParams.get('block_w')!)     : undefined,
        block_h:      searchParams.has('block_h')
          ? parseInt(searchParams.get('block_h')!)     : undefined,
        gap:          searchParams.has('gap')
          ? parseInt(searchParams.get('gap')!)          : undefined,
        char_spacing: searchParams.has('char_spacing')
          ? parseInt(searchParams.get('char_spacing')!) : undefined,
        block_radius: searchParams.has('block_radius')
          ? parseFloat(searchParams.get('block_radius')!) : undefined,
      })

    // ── GitHub-backed routes — require username + token ──────────────────────
    } else {
      const username = searchParams.get('username')
      if (!username || !USERNAME_REGEX.test(username)) {
        throw new CustomError('Invalid or missing username', 'USER_NOT_FOUND')
      }

      if (req.env.WHITELIST) {
        const whitelist = new Set(
          req.env.WHITELIST.split(',').map(s => s.trim().toLowerCase())
        )
        if (!whitelist.has(username.toLowerCase())) {
          throw new CustomError('User not whitelisted', 'SERVER_ERROR')
        }
      }

      if (!req.env.GITHUB_TOKEN) {
        throw new CustomError('GITHUB_TOKEN environment variable not set', 'SERVER_ERROR')
      }

      if (pathname === '/api/stats' || pathname === '/api/stats/') {
        const stats = await fetchStats(username, {
          token: req.env.GITHUB_TOKEN,
          include_all_commits: searchParams.get('include_all_commits') === 'true',
        })
        body = renderStatsCard(stats, {
          username,
          theme:         searchParams.get('theme')        || undefined,
          title_color:   searchParams.get('title_color')  || undefined,
          text_color:    searchParams.get('text_color')   || undefined,
          bg_color:      searchParams.get('bg_color')     || undefined,
          icon_color:    searchParams.get('icon_color')   || undefined,
          border_color:  searchParams.get('border_color') || undefined,
          hide_border:   searchParams.get('hide_border')  === 'true',
          hide_title:    searchParams.get('hide_title')   === 'true',
          custom_title:  searchParams.get('custom_title') || undefined,
          border_radius: searchParams.has('border_radius')
            ? parseFloat(searchParams.get('border_radius')!) : undefined,
          hide:          searchParams.get('hide')         || undefined,
          show_icons:    searchParams.get('show_icons')   === 'true',
          hide_rank:     searchParams.get('hide_rank')    === 'true',
          ring_color:    searchParams.get('ring_color')   || undefined,
          number_format: (searchParams.get('number_format') as any) || 'short',
        })

      } else if (pathname === '/api/top-langs') {
        const langs = await fetchTopLangs(username, {
          token:        req.env.GITHUB_TOKEN,
          exclude_repo: searchParams.get('exclude_repo')?.split(','),
          langs_count:  searchParams.has('langs_count')
            ? parseInt(searchParams.get('langs_count')!) : undefined,
          hide:         searchParams.get('hide')?.split(','),
        })
        body = renderLangsCard(langs, {
          username,
          theme:         searchParams.get('theme')        || undefined,
          title_color:   searchParams.get('title_color')  || undefined,
          text_color:    searchParams.get('text_color')   || undefined,
          bg_color:      searchParams.get('bg_color')     || undefined,
          border_color:  searchParams.get('border_color') || undefined,
          hide_border:   searchParams.get('hide_border')  === 'true',
          hide_title:    searchParams.get('hide_title')   === 'true',
          custom_title:  searchParams.get('custom_title') || undefined,
          border_radius: searchParams.has('border_radius')
            ? parseFloat(searchParams.get('border_radius')!) : undefined,
          layout:        (searchParams.get('layout') || 'normal') as
            'normal' | 'compact' | 'donut' | 'pie',
          hide_progress: searchParams.get('hide_progress') === 'true',
        })

      } else if (pathname === '/api/pin') {
        const repo = searchParams.get('repo')
        if (!repo) throw new CustomError('Missing repo parameter', 'USER_NOT_FOUND')

        const repoData = await fetchRepo(username, repo, {
          token: req.env.GITHUB_TOKEN,
        })
        body = renderRepoCard(repoData, {
          username,
          repo,
          theme:         searchParams.get('theme')        || undefined,
          title_color:   searchParams.get('title_color')  || undefined,
          text_color:    searchParams.get('text_color')   || undefined,
          bg_color:      searchParams.get('bg_color')     || undefined,
          icon_color:    searchParams.get('icon_color')   || undefined,
          border_color:  searchParams.get('border_color') || undefined,
          hide_border:   searchParams.get('hide_border')  === 'true',
          border_radius: searchParams.has('border_radius')
            ? parseFloat(searchParams.get('border_radius')!) : undefined,
          show_owner:    searchParams.get('show_owner')   === 'true',
        })

      } else {
        throw new CustomError('Endpoint not found', 'SERVER_ERROR')
      }
    }

    await cache.set(cacheKey, body, cacheSeconds)

    return {
      body,
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
      },
    }
  } catch (err: any) {
    let msg = err instanceof CustomError ? err.message : 'Something went wrong'
    let secondary: string | undefined

    if (err instanceof CustomError) {
      if      (err.type === 'USER_NOT_FOUND')  secondary = 'Check that the username exists and is spelled correctly'
      else if (err.type === 'RATE_LIMIT')      secondary = 'GitHub API rate limit exceeded — try again later'
      else if (err.type === 'NETWORK_ERROR')   secondary = 'Could not reach GitHub API — try again later'
      else if (err.type === 'INVALID_TOKEN')   secondary = 'Server configuration error — contact the instance owner'
    } else {
      secondary = 'An unexpected error occurred — try again later'
    }

    return {
      body: renderErrorSVG(msg, secondary),
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  }
}
