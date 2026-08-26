import express from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { handleRequest } from '../src/router'

const app = express()
const PORT = process.env.PORT || 3000
const here = dirname(fileURLToPath(import.meta.url))
const landing = readFileSync(join(here, '../../public/index.html'), 'utf-8')

app.get(['/'], (_req, res) => {
  res.setHeader('Content-Type', 'text/html')
  res.send(landing)
})

app.get('/api/*', async (req, res) => {
  const result = await handleRequest({
    url: `http://localhost${req.url}`,
    method: req.method,
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
      CACHE_SECONDS: process.env.CACHE_SECONDS,
      WHITELIST: process.env.WHITELIST,
      YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
      ICON_REPO: process.env.ICON_REPO,
    }
  })
  
  Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v))
  res.status(result.status).send(result.body)
})

app.listen(PORT, () => console.log(`gh-stats running on :${PORT}`))
