import express from 'express'
import { handleRequest } from '../src/router'

const app = express()
const PORT = process.env.PORT || 3000

app.get('/api/*', async (req, res) => {
  const result = await handleRequest({
    url: `http://localhost${req.url}`,
    method: req.method,
    env: {
      GITHUB_TOKEN: process.env.GITHUB_TOKEN!,
      CACHE_SECONDS: process.env.CACHE_SECONDS,
      WHITELIST: process.env.WHITELIST,
    }
  })
  
  Object.entries(result.headers).forEach(([k, v]) => res.setHeader(k, v))
  res.status(result.status).send(result.body)
})

app.listen(PORT, () => console.log(`gh-stats running on :${PORT}`))
