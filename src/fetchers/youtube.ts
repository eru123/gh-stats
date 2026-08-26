// YouTube cards — drop-in replacement for ytcards.demolab.com/videos
// (DenverCoder1/github-readme-youtube-cards). Uses YouTube Data API v3.

import { CustomError } from '../utils/errors'
import { VideoData } from '../types'

const YT_API = 'https://www.googleapis.com/youtube/v3'

interface FetchVideosOptions {
  apiKey: string
  channelId?: string
  playlistId?: string
  maxVideos?: number
  filter?: string  // regex — matching videos are excluded
}

async function ytFetch(path: string, params: Record<string, string>, apiKey: string): Promise<any> {
  const url = new URL(`${YT_API}/${path}`)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'gh-stats' },
  }).catch(() => {
    throw new CustomError('Could not reach the YouTube API', 'NETWORK_ERROR')
  })

  if (!res.ok) {
    if (res.status === 403) {
      const body = await res.text().catch(() => '')
      if (/API key not valid|keyInvalid/i.test(body)) {
        throw new CustomError('YOUTUBE_API_KEY is invalid', 'SERVER_ERROR')
      }
      if (/quota/i.test(body)) {
        throw new CustomError('YouTube API quota exceeded', 'RATE_LIMIT')
      }
      throw new CustomError('YouTube API access denied — check YOUTUBE_API_KEY', 'SERVER_ERROR')
    }
    throw new CustomError(`YouTube API error: ${res.status}`, 'SERVER_ERROR')
  }
  return res.json()
}

async function thumbnailToDataUri(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'gh-stats' } }).catch(() => null)
  if (!res || !res.ok) throw new CustomError('Could not load video thumbnail', 'NETWORK_ERROR')
  const buf = await res.arrayBuffer()
  let bin = ''
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return `data:image/jpeg;base64,${btoa(bin)}`
}

export async function fetchVideos(options: FetchVideosOptions): Promise<VideoData[]> {
  if (!options.channelId && !options.playlistId) {
    throw new CustomError('Provide a channel_id or playlist_id parameter', 'USER_NOT_FOUND')
  }
  if (!options.apiKey) {
    throw new CustomError('YOUTUBE_API_KEY environment variable not set', 'SERVER_ERROR')
  }

  // resolve the uploads playlist for a channel
  let playlistId = options.playlistId
  if (!playlistId && options.channelId) {
    const channel = await ytFetch('channels', {
      part: 'contentDetails', id: options.channelId,
    }, options.apiKey)
    playlistId = channel?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads
    if (!playlistId) {
      throw new CustomError('Channel not found — check channel_id', 'USER_NOT_FOUND')
    }
  }

  if (!playlistId) {
    throw new CustomError('Provide a channel_id or playlist_id parameter', 'USER_NOT_FOUND')
  }

  const maxVideos = Math.min(Math.max(options.maxVideos || 6, 1), 50)
  // fetch extra entries so filtering can still fill the requested count
  const items = await ytFetch('playlistItems', {
    part: 'snippet', playlistId, maxResults: String(Math.min(maxVideos + 15, 50)),
  }, options.apiKey)

  let entries: any[] = items?.items || []

  if (options.filter) {
    try {
      const filterRe = new RegExp(options.filter, 'i')
      entries = entries.filter((e) => !filterRe.test(e?.snippet?.title || ''))
    } catch {
      throw new CustomError('Invalid filter regular expression', 'SERVER_ERROR')
    }
  }
  entries = entries.filter((e) => e?.snippet?.title !== 'Private video')
    .slice(0, maxVideos)

  if (entries.length === 0) {
    throw new CustomError('No videos found', 'USER_NOT_FOUND')
  }

  // statistics need a separate call keyed by video ids
  const ids = entries.map((e) => e.snippet.resourceId.videoId).join(',')
  const stats = await ytFetch('videos', { part: 'statistics', id: ids }, options.apiKey)
  const viewCounts = new Map<string, number>(
    (stats?.items || []).map((v: any) => [v.id, Number(v.statistics?.viewCount || 0)])
  )

  const thumbs = await ytFetch('videos', { part: 'snippet', id: ids }, options.apiKey)
  const thumbUrls = new Map<string, string>(
    (thumbs?.items || []).map((v: any) => {
      const t = v.snippet?.thumbnails || {}
      const chosen = t.maxres || t.standard || t.high || t.medium || t.default
      return [v.id, chosen?.url]
    })
  )

  return Promise.all(entries.map(async (e) => {
    const vid = e.snippet.resourceId.videoId
    const thumbUrl = thumbUrls.get(vid) || e.snippet.thumbnails?.medium?.url
    return {
      id: vid,
      title: e.snippet.title,
      publishedAt: e.snippet.publishedAt,
      viewCount: viewCounts.get(vid) || 0,
      channelTitle: e.snippet.channelTitle || e.snippet.videoOwnerChannelTitle || '',
      thumbnailData: await thumbnailToDataUri(thumbUrl || e.snippet.thumbnails?.default?.url || ''),
    }
  }))
}
