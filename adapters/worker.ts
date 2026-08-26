import { handleRequest } from '../src/router'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const result = await handleRequest({
      url: request.url,
      method: request.method,
    env: {
      GITHUB_TOKEN: env.GITHUB_TOKEN,
      CACHE_SECONDS: env.CACHE_SECONDS,
      WHITELIST: env.WHITELIST,
      YOUTUBE_API_KEY: env.YOUTUBE_API_KEY,
      ICON_REPO: env.ICON_REPO,
    }
    })
    
    return new Response(result.body, {
      status: result.status,
      headers: result.headers,
    })
  }
}

interface Env {
  GITHUB_TOKEN: string
  CACHE_SECONDS?: string
  WHITELIST?: string
  YOUTUBE_API_KEY?: string
  ICON_REPO?: string
}
