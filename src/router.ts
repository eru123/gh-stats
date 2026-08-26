import { fetchStats } from './fetchers/stats'
import { fetchTopLangs } from './fetchers/langs'
import { fetchRepo } from './fetchers/repo'
import { fetchStreak } from './fetchers/streak'
import { fetchVideos } from './fetchers/youtube'
import { resolveIcon } from './fetchers/icons'
import { fetchDynamicJson, queryJson, stringifyQueryResult } from './fetchers/dynamic'
import { renderStatsCard } from './cards/stats-card'
import { renderLangsCard } from './cards/langs-card'
import { renderRepoCard } from './cards/repo-card'
import { renderAsciiCard } from './cards/ascii-card'
import { renderStreakCard } from './cards/streak-card'
import { renderTypingCard } from './cards/typing-card'
import { renderBadge, resolveColor } from './cards/badge-card'
import { renderVideosCard } from './cards/videos-card'
import { CustomError, renderErrorSVG } from './utils/errors'
import { MemoryCache, CfCache } from './utils/cache'
import { BadgeStyle } from './types'

export interface AppRequest {
  url: string
  method: string
  env: {
    GITHUB_TOKEN: string
    CACHE_SECONDS?: string
    WHITELIST?: string
    YOUTUBE_API_KEY?: string
    ICON_REPO?: string
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

/** forwards a shields.io path, swapping `logo` for a resolved custom icon */
async function proxyShields(
  shieldsPath: string,
  searchParams: URLSearchParams,
  iconData?: string
): Promise<{ body: string; headers: Record<string, string> }> {
  const qs = new URLSearchParams(searchParams)
  qs.delete('host')
  if (iconData) qs.set('logo', iconData)
  const target = `https://img.shields.io/${shieldsPath}${qs.toString() ? `?${qs}` : ''}`

  const res = await fetch(target, {
    headers: { 'User-Agent': 'gh-stats' },
  }).catch(() => {
    throw new CustomError('Could not reach shields.io', 'NETWORK_ERROR')
  })
  if (!res.ok) {
    throw new CustomError(`shields.io responded with ${res.status}`, 'SERVER_ERROR')
  }
  return {
    body: await res.text(),
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/svg+xml',
    },
  }
}

export async function handleRequest(req: AppRequest): Promise<AppResponse> {
  let pathname = ''
  try {
    const url = new URL(req.url)
    pathname = url.pathname
    const { searchParams } = url

    // streak data changes daily — cache shorter than the static-ish cards
    const defaultTTL =
      pathname === '/api/stats' || pathname === '/api/stats/' ||
      pathname === '/api/streak' || pathname === '/api/streak/' ||
      pathname === '/api/videos' || pathname.startsWith('/api/badge')
        ? 21600 : 86400
    const cacheSeconds = req.env.CACHE_SECONDS
      ? parseInt(req.env.CACHE_SECONDS)
      : defaultTTL

    const contentType =
      (pathname === '/api/streak' && searchParams.get('type') === 'json') || pathname.endsWith('.json')
        ? 'application/json'
        : 'image/svg+xml'

    const cacheKey = url.toString()
    const cache = isCloudflareEnv(req.env) ? new CfCache() : memCache

    const cached = await cache.get(cacheKey)
    if (cached) {
      return {
        body: cached,
        status: 200,
        headers: {
          'Content-Type': contentType,
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

    // ── Typing SVG — readme-typing-svg replacement, no token required ────────
    } else if (pathname === '/api/typing') {
      const separator = searchParams.get('separator') || ';'
      const rawLines = (searchParams.get('lines') || '')
        .split(separator)
        .map(l => l.trim().slice(0, 200))
        .filter(l => l.length > 0)
        .slice(0, 50)
      if (rawLines.length === 0) {
        throw new CustomError('Missing or empty lines parameter', 'USER_NOT_FOUND')
      }
      body = renderTypingCard(rawLines, {
        font:         searchParams.get('font')         || undefined,
        color:        (searchParams.get('color')       || undefined)?.replace(/^#/, ''),
        background:   (searchParams.get('background')  || undefined)?.replace(/^#/, ''),
        size:         searchParams.has('size')  ? parseInt(searchParams.get('size')!)  : undefined,
        width:        searchParams.has('width') ? parseInt(searchParams.get('width')!) : undefined,
        height:       searchParams.has('height') ? parseInt(searchParams.get('height')!) : undefined,
        center:       searchParams.get('center')  === 'true',
        vCenter:      searchParams.get('vCenter') === 'true',
        multiline:    searchParams.get('multiline') === 'true',
        duration:     searchParams.has('duration') ? parseInt(searchParams.get('duration')!) : undefined,
        pause:        searchParams.has('pause')    ? parseInt(searchParams.get('pause')!)   : undefined,
        repeat:       searchParams.get('repeat') !== 'false',
        letterSpacing: searchParams.get('letterSpacing') || undefined,
      })

    // ── Badges — custom-icon-badges / shields replacement ────────────────────
    } else if (pathname === '/api/badge' || pathname.startsWith('/api/badge/')) {
      const style = (searchParams.get('style') || 'flat') as BadgeStyle
      const logoParam = searchParams.get('logo') || undefined
      const iconData = await resolveIcon(logoParam, {
        logoColor: searchParams.get('logoColor') || undefined,
        iconRepo: req.env.ICON_REPO,
      })

      const badgePath = decodeURIComponent(pathname.replace(/^\/api\/badge\/?/, '')).replace(/\.svg$/, '')

      if (badgePath === 'dynamic/json') {
        // native dynamic formatter
        const sourceUrl = searchParams.get('url')
        const query = searchParams.get('query')
        if (!sourceUrl || !query) {
          throw new CustomError('dynamic/json requires url and query parameters', 'USER_NOT_FOUND')
        }
        const data = await fetchDynamicJson(sourceUrl)
        const value = stringifyQueryResult(queryJson(data, query))
        const prefix = searchParams.get('prefix') || ''
        const suffix = searchParams.get('suffix') || ''
        const color = searchParams.has('queryColor')
          ? resolveColor(stringifyQueryResult(queryJson(data, searchParams.get('queryColor')!)))
          : resolveColor(searchParams.get('color'), 'brightgreen')
        body = renderBadge({
          label: searchParams.get('label') || 'custom badge',
          message: `${prefix}${value}${suffix}`,
          color,
          labelColor: resolveColor(searchParams.get('labelColor'), undefined),
          style, logoData: iconData,
          logoWidth: searchParams.has('logoWidth') ? parseInt(searchParams.get('logoWidth')!) : undefined,
        })
      } else if (badgePath === 'static/v1' || badgePath === 'static/v1.svg') {
        body = renderBadge({
          label: searchParams.get('label') || '',
          message: searchParams.get('message') || '',
          color: resolveColor(searchParams.get('color')),
          labelColor: resolveColor(searchParams.get('labelColor'), undefined),
          style, logoData: iconData,
          logoWidth: searchParams.has('logoWidth') ? parseInt(searchParams.get('logoWidth')!) : undefined,
        })
      } else if (badgePath && !badgePath.includes('/')) {
        // static badge path: /badge/<label>-<message>-<color> (use -- for a literal dash)
        const SENTINEL = '\x00'
        const parts = badgePath.replace(/--/g, SENTINEL).split('-')
          .map(p => p.replace(new RegExp(SENTINEL, 'g'), '-'))
        if (parts.length !== 3) {
          throw new CustomError('Expected /api/badge/<label>-<message>-<color> (encode literal dashes as --)', 'USER_NOT_FOUND')
        }
        body = renderBadge({
          label: parts[0],
          message: parts[1],
          color: resolveColor(parts[2]),
          labelColor: resolveColor(searchParams.get('labelColor'), undefined),
          style, logoData: iconData,
          logoWidth: searchParams.has('logoWidth') ? parseInt(searchParams.get('logoWidth')!) : undefined,
        })
      } else {
        // anything else (dynamic/yaml|xml|toml, /github/*, /npm/*, …) proxies to
        // shields.io with the resolved custom icon injected — the same
        // architecture custom-icon-badges uses upstream
        const proxied = await proxyShields(badgePath, searchParams, iconData)
        await cache.set(cacheKey, proxied.body, cacheSeconds)
        return {
          body: proxied.body,
          status: 200,
          headers: {
            ...proxied.headers,
            'Cache-Control': `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}`,
          },
        }
      }

    // ── YouTube cards — ytcards replacement, needs YOUTUBE_API_KEY ──────────
    } else if (pathname === '/api/videos') {
      const videos = await fetchVideos({
        apiKey: req.env.YOUTUBE_API_KEY || '',
        channelId: searchParams.get('channel_id') || undefined,
        playlistId: searchParams.get('playlist_id') || undefined,
        maxVideos: searchParams.has('max_videos')
          ? parseInt(searchParams.get('max_videos')!) : undefined,
        filter: searchParams.get('filter') || undefined,
      })
      body = renderVideosCard(videos, {
        width:        searchParams.has('width') ? parseInt(searchParams.get('width')!) : undefined,
        border_radius: searchParams.has('border_radius')
          ? parseFloat(searchParams.get('border_radius')!) : undefined,
        background_color: searchParams.get('background_color') || undefined,
        title_color:  searchParams.get('title_color')  || undefined,
        stats_color:  searchParams.get('stats_color')  || undefined,
        max_title_lines: searchParams.has('max_title_lines')
          ? parseInt(searchParams.get('max_title_lines')!) : undefined,
      })

    // ── GitHub-backed routes — require username + token ──────────────────────
    } else {
      // `username` is the gh-stats convention; `user` is accepted as an alias
      // for drop-in compatibility with github-readme-streak-stats URLs
      const username = searchParams.get('username') || searchParams.get('user')
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

      } else if (pathname === '/api/streak' || pathname === '/api/streak/') {
        const streak = await fetchStreak(username, {
          token:         req.env.GITHUB_TOKEN,
          starting_year: searchParams.has('starting_year')
            ? parseInt(searchParams.get('starting_year')!) : undefined,
          timezone:      searchParams.get('timezone') || undefined,
          mode:          (searchParams.get('mode') === 'weekly' ? 'weekly' : 'daily'),
          exclude_days:  searchParams.get('exclude_days')?.split(','),
          exclude_dates: searchParams.get('exclude_dates')?.split(','),
        })

        if (searchParams.get('type') === 'json') {
          body = JSON.stringify(streak)
        } else {
          body = renderStreakCard(streak, {
            username,
            theme:         searchParams.get('theme')        || undefined,
            title_color:   searchParams.get('title_color')  || undefined,
            text_color:    searchParams.get('text_color')   || undefined,
            bg_color:      searchParams.get('bg_color')     || undefined,
            border_color:  searchParams.get('border_color') || undefined,
            hide_border:   searchParams.get('hide_border')  === 'true',
            hide_title:    searchParams.get('hide_title')   !== 'false',
            custom_title:  searchParams.get('custom_title') || undefined,
            border_radius: searchParams.has('border_radius')
              ? parseFloat(searchParams.get('border_radius')!) : undefined,
            date_format:   searchParams.get('date_format')  || undefined,
            locale:        searchParams.get('locale')       || undefined,
            card_width:    searchParams.has('card_width')
              ? parseInt(searchParams.get('card_width')!)   : undefined,
            disable_animations: searchParams.get('disable_animations') === 'true',
            // upstream github-readme-streak-stats color params
            background:    searchParams.get('background')    || undefined,
            stroke:        searchParams.get('stroke')        || undefined,
            ring:          searchParams.get('ring')          || undefined,
            fire:          searchParams.get('fire')          || undefined,
            currStreakNum: searchParams.get('currStreakNum') || undefined,
            currStreakLabel: searchParams.get('currStreakLabel') || undefined,
            sideNums:      searchParams.get('sideNums')      || undefined,
            sideLabels:    searchParams.get('sideLabels')    || undefined,
            dates:         searchParams.get('dates')         || undefined,
          })
        }

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
        'Content-Type': contentType,
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

    // badge endpoints report errors as badges, not as the large error card
    if (pathname.startsWith('/api/badge')) {
      return {
        body: renderBadge({
          label: 'error',
          message: msg.slice(0, 80),
          color: 'e05d44',
          style: 'flat',
        }),
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
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
