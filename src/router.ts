import { fetchStats } from './fetchers/stats'
import { fetchTopLangs } from './fetchers/langs'
import { fetchRepo } from './fetchers/repo'
import { renderStatsCard } from './cards/stats-card'
import { renderLangsCard } from './cards/langs-card'
import { renderRepoCard } from './cards/repo-card'
import { CustomError, renderErrorSVG } from './utils/errors'

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

// Global memory cache fallback
import { MemoryCache, CfCache } from './utils/cache'
const memCache = new MemoryCache()

function isCloudflareEnv(env: any): boolean {
  return typeof (globalThis as any).caches !== 'undefined' && typeof (globalThis as any).caches.default !== 'undefined'
}

export async function handleRequest(req: AppRequest): Promise<AppResponse> {
  const cacheOptions = {
    stats: 21600,
    langs: 86400,
    repo: 86400
  }

  try {
    const url = new URL(req.url)
    const { pathname, searchParams } = url

    let cacheSeconds = req.env.CACHE_SECONDS ? parseInt(req.env.CACHE_SECONDS) : 0
    let type = 'stats'
    if (pathname === '/api/top-langs') type = 'langs'
    if (pathname === '/api/pin') type = 'repo'

    if (!cacheSeconds) {
      if (type === 'stats') cacheSeconds = cacheOptions.stats
      if (type === 'langs') cacheSeconds = cacheOptions.langs
      if (type === 'repo') cacheSeconds = cacheOptions.repo
    }

    const cacheKey = url.toString()
    const cache = isCloudflareEnv(req.env) ? new CfCache() : memCache

    const cached = await cache.get(cacheKey)
    if (cached) {
      return {
        body: cached,
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
        }
      }
    }

    const username = searchParams.get('username')
    if (!username || !/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username)) {
      throw new CustomError('Invalid or missing username', 'USER_NOT_FOUND')
    }

    if (req.env.WHITELIST) {
      const whitelist = new Set(req.env.WHITELIST.split(',').map(s => s.trim().toLowerCase()))
      if (!whitelist.has(username.toLowerCase())) {
        throw new CustomError('User not whitelisted', 'SERVER_ERROR')
      }
    }

    if (!req.env.GITHUB_TOKEN) {
      throw new CustomError('GITHUB_TOKEN environment variable not set', 'SERVER_ERROR')
    }

    let body = ''

    if (pathname === '/api/stats' || pathname === '/api/stats/') {
      const stats = await fetchStats(username, {
        token: req.env.GITHUB_TOKEN,
        include_all_commits: searchParams.get('include_all_commits') === 'true'
      })
      body = renderStatsCard(stats, {
        username,
        theme: searchParams.get('theme') || undefined,
        title_color: searchParams.get('title_color') || undefined,
        text_color: searchParams.get('text_color') || undefined,
        bg_color: searchParams.get('bg_color') || undefined,
        icon_color: searchParams.get('icon_color') || undefined,
        border_color: searchParams.get('border_color') || undefined,
        hide_border: searchParams.get('hide_border') === 'true',
        hide_title: searchParams.get('hide_title') === 'true',
        custom_title: searchParams.get('custom_title') || undefined,
        border_radius: searchParams.has('border_radius') ? parseFloat(searchParams.get('border_radius')!) : undefined,
        
        hide: searchParams.get('hide') || undefined,
        show_icons: searchParams.get('show_icons') === 'true',
        hide_rank: searchParams.get('hide_rank') === 'true',
        ring_color: searchParams.get('ring_color') || undefined,
        number_format: searchParams.get('number_format') as any || 'short'
      })
    } else if (pathname === '/api/top-langs') {
      const langs = await fetchTopLangs(username, {
        token: req.env.GITHUB_TOKEN,
        exclude_repo: searchParams.get('exclude_repo')?.split(','),
        langs_count: searchParams.has('langs_count') ? parseInt(searchParams.get('langs_count')!) : undefined,
        hide: searchParams.get('hide')?.split(',')
      })
      body = renderLangsCard(langs, {
        username,
        theme: searchParams.get('theme') || undefined,
        title_color: searchParams.get('title_color') || undefined,
        text_color: searchParams.get('text_color') || undefined,
        bg_color: searchParams.get('bg_color') || undefined,
        border_color: searchParams.get('border_color') || undefined,
        hide_border: searchParams.get('hide_border') === 'true',
        hide_title: searchParams.get('hide_title') === 'true',
        custom_title: searchParams.get('custom_title') || undefined,
        border_radius: searchParams.has('border_radius') ? parseFloat(searchParams.get('border_radius')!) : undefined,
        
        hide_progress: searchParams.get('hide_progress') === 'true'
      })
    } else if (pathname === '/api/pin') {
      const repo = searchParams.get('repo')
      if (!repo) throw new CustomError('Missing repo parameter', 'USER_NOT_FOUND')

      const repoData = await fetchRepo(username, repo, {
        token: req.env.GITHUB_TOKEN
      })
      body = renderRepoCard(repoData, {
        username,
        repo,
        theme: searchParams.get('theme') || undefined,
        title_color: searchParams.get('title_color') || undefined,
        text_color: searchParams.get('text_color') || undefined,
        bg_color: searchParams.get('bg_color') || undefined,
        icon_color: searchParams.get('icon_color') || undefined,
        border_color: searchParams.get('border_color') || undefined,
        hide_border: searchParams.get('hide_border') === 'true',
        border_radius: searchParams.has('border_radius') ? parseFloat(searchParams.get('border_radius')!) : undefined,
        
        show_owner: searchParams.get('show_owner') === 'true',
      })
    } else {
      throw new CustomError('Endpoint not found', 'SERVER_ERROR')
    }

    await cache.set(cacheKey, body, cacheSeconds)

    return {
      body,
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`
      }
    }

  } catch (err: any) {
    let msg = err.message || 'Unknown error occurred'
    let secondary = err.type ? `Error type: ${err.type}` : undefined
    
    if (!(err instanceof CustomError)) {
      secondary = 'Internal Server Error'
    }

    return {
      body: renderErrorSVG(msg, secondary),
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    }
  }
}
