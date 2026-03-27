export interface Cache {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
}

export class MemoryCache implements Cache {
  private store = new Map<string, { value: string, expires: number }>()

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key)
    if (!item) return null
    if (Date.now() > item.expires) {
      this.store.delete(key)
      return null
    }
    return item.value
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000
    })
  }
}

export class CfCache implements Cache {
  // @ts-ignore - caches is a Cloudflare global
  private cache = caches.default

  async get(key: string): Promise<string | null> {
    const url = new URL(`https://cache.internal/${key}`)
    const match = await this.cache.match(url as any)
    if (match) {
      return match.text()
    }
    return null
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const url = new URL(`https://cache.internal/${key}`)
    const response = new Response(value, {
      headers: {
        'Cache-Control': `max-age=${ttlSeconds}`
      }
    })
    
    try {
      await this.cache.put(url, response)
    } catch(e) {
      // Ignore cache put errors
    }
  }
}
