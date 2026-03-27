# gh-stats

A Self-Hosted GitHub README Stats Card Generator.

A TypeScript replacement for `anuraghazra/github-readme-stats` that runs on **both a VPS (Node.js/Express)** and **Cloudflare Workers** from a single shared codebase.

## Features

- **Stats Card** — Shows stars, commits, PRs, issues, followers, and a rank badge
- **Top Languages Card** — Shows top languages by bytes across public repos
- **Repo Pin Card** — Shows a pinnable repo card with stars, forks, and description
- Dual-Runtime Architecture (Runs on Cloudflare Workers and Node.js)
- Easy Deployment

## Deployment Guide

### VPS (Node.js)
```bash
# 1. Clone and build
git clone <your-repo>
cd gh-stats
npm install && npm run build

# 2. Set environment
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# 3. Run
npm start
# or with Docker:
docker build -t gh-stats .
docker run -e GITHUB_TOKEN=$GITHUB_TOKEN -p 3000:3000 gh-stats
```

Usage in README:
```markdown
![Stats](https://your-vps.com/api/stats?username=eru123&theme=dark&show_icons=true)
```

### Cloudflare Workers (Free tier — 100k req/day)
```bash
# 1. Install wrangler
npm install -g wrangler

# 2. Set token as secret (never in wrangler.toml)
wrangler secret put GITHUB_TOKEN

# 3. Deploy
npm run deploy
```

Usage in README:
```markdown
![Stats](https://gh-stats.your-subdomain.workers.dev/api/stats?username=eru123)
```

## API Reference

### Stats Card
```
/api/stats?username=eru123
  &theme=dark
  &show_icons=true
  &hide=contribs,issues
  &include_all_commits=true
  &hide_rank=false
  &ring_color=58a6ff
  &number_format=short
  &cache_seconds=21600
```

### Top Languages Card
```
/api/top-langs?username=eru123
  &layout=compact
  &langs_count=8
  &hide=html,css
  &exclude_repo=old-project
  &theme=tokyonight
```

### Repo Pin Card
```
/api/pin?username=eru123&repo=holyphp
  &show_owner=true
  &theme=radical
```
