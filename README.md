# gh-stats

A self-hosted GitHub README stats card generator. Drop-in replacement for `anuraghazra/github-readme-stats` that runs on **Node.js/Express** or **Cloudflare Workers** from a single codebase.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Cards](#cards)
  - [Stats Card](#stats-card)
  - [Top Languages Card](#top-languages-card)
  - [Repo Pin Card](#repo-pin-card)
- [Themes](#themes)
- [Common Options](#common-options)
- [Deployment](#deployment)
  - [Node.js (VPS / Local)](#nodejs-vps--local)
  - [Docker](#docker)
  - [Cloudflare Workers](#cloudflare-workers)
- [Environment Variables](#environment-variables)

---

## Quick Start

Once deployed, embed any card in your GitHub README as a standard Markdown image:

```markdown
![GitHub Stats](https://gh-stats.skiddph.com/api/stats?username=YOUR_USERNAME)
![Top Langs](https://gh-stats.skiddph.com/api/top-langs?username=YOUR_USERNAME)
![Repo Pin](https://gh-stats.skiddph.com/api/pin?username=YOUR_USERNAME&repo=REPO_NAME)
```

---

## Cards

### Stats Card

**Endpoint:** `GET /api/stats`

Displays your GitHub stats: total stars, commits, PRs, issues, followers, contributed-to count, and an animated rank badge.

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&theme=dark&show_icons=true)
```

**Preview layout:**
```
┌─────────────────────────────────────────┐
│  eru123's GitHub Stats            [A+]  │
│                                  ╭───╮  │
│  ★ Total Stars        1,234      │   │  │
│  ◉ Total Commits      5,678      ╰───╯  │
│  ⑂ Total PRs          90               │
│  ◎ Total Issues       45               │
│  ☻ Followers          52               │
│  ⑂ Contributed to     12               │
└─────────────────────────────────────────┘
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `username` | string | **required** | GitHub username |
| `show_icons` | boolean | `false` | Show icons next to each stat |
| `hide` | string | — | Comma-separated stats to hide: `stars`, `commits`, `prs`, `issues`, `followers`, `contribs` |
| `hide_rank` | boolean | `false` | Hide the rank badge |
| `ring_color` | hex | title color | Color of the rank ring (without `#`) |
| `include_all_commits` | boolean | `false` | Count all-time commits instead of just the current year |
| `number_format` | `short` \| `long` | `short` | `short` → `1.2k`  /  `long` → `1,234` |
| `cache_seconds` | number | `21600` | Cache TTL in seconds (6 hours default) |

**Examples:**

```markdown
<!-- Dark theme with icons, hiding issues -->
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&theme=dark&show_icons=true&hide=issues)

<!-- Custom ring color, all-time commits, long number format -->
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&ring_color=58a6ff&include_all_commits=true&number_format=long)

<!-- Minimal — no rank badge, no title -->
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&hide_rank=true&hide_title=true)
```

---

### Top Languages Card

**Endpoint:** `GET /api/top-langs`

Shows the programming languages you use most across your public repositories, measured by bytes of code.

```markdown
![Top Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&theme=dark)
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `username` | string | **required** | GitHub username |
| `layout` | `normal` \| `compact` \| `donut` \| `pie` | `normal` | Card layout style |
| `langs_count` | number | `5` | Number of languages to show (max from your repos) |
| `hide` | string | — | Comma-separated language names to exclude, e.g. `html,css` |
| `exclude_repo` | string | — | Comma-separated repo names to exclude from language counting |
| `hide_progress` | boolean | `false` | Hide the progress bars (normal layout only) |
| `cache_seconds` | number | `86400` | Cache TTL in seconds (24 hours default) |

**Layout styles:**

```markdown
<!-- Normal: stacked list with progress bars (default) -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=normal)

<!-- Compact: two-column grid -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=compact)

<!-- Donut chart -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=donut)

<!-- Pie chart -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=pie)
```

**Examples:**

```markdown
<!-- Show 8 languages, hide HTML and CSS, compact layout -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=compact&langs_count=8&hide=html,css)

<!-- Exclude a repo from counting, tokyonight theme -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&exclude_repo=old-project&theme=tokyonight)

<!-- Donut chart without a title -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=donut&hide_title=true)
```

---

### Repo Pin Card

**Endpoint:** `GET /api/pin`

Shows a card for a specific repository with its description, primary language, star count, and fork count.

```markdown
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=holyphp)
```

**Preview layout:**
```
┌─────────────────────────────────────────┐
│  📦 eru123/holyphp                      │
│  A lightweight PHP framework            │
│  ● TypeScript    ★ 42    ⑂ 8           │
└─────────────────────────────────────────┘
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `username` | string | **required** | Repository owner's GitHub username |
| `repo` | string | **required** | Repository name |
| `show_owner` | boolean | `false` | Show `owner/repo` instead of just `repo` in the title |
| `cache_seconds` | number | `86400` | Cache TTL in seconds (24 hours default) |

**Examples:**

```markdown
<!-- Basic repo pin -->
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=holyphp)

<!-- Show owner prefix, radical theme -->
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=holyphp&show_owner=true&theme=radical)
```

---

## Themes

Apply a theme with `&theme=NAME` on any card.

| Name | Preview colors |
|---|---|
| `default` | Blue title, gray text, white background |
| `dark` | White title, gray text, black background |
| `radical` | Pink title, cyan text, dark background |
| `tokyonight` | Blue title, teal text, navy background |
| `dracula` | Pink title, cyan text, dark background |
| `gruvbox` | Yellow title, cream text, dark background |
| `onedark` | Gold title, red text, dark background |
| `transparent` | Purple title, transparent background |

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&theme=tokyonight)
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&theme=dracula)
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=holyphp&theme=gruvbox)
```

> **Tip:** Use `theme=transparent` for cards that adapt to GitHub's light/dark mode switching.

---

## Common Options

These parameters work on **all three cards**:

| Parameter | Type | Default | Description |
|---|---|---|---|
| `theme` | string | `default` | Named theme (see [Themes](#themes)) |
| `title_color` | hex | theme value | Title text color (without `#`), e.g. `ff6e96` |
| `text_color` | hex | theme value | Body text color (without `#`) |
| `icon_color` | hex | theme value | Icon color (without `#`) |
| `bg_color` | hex | theme value | Background color (without `#`). Use `00000000` for transparent |
| `border_color` | hex | theme value | Border color (without `#`) |
| `hide_border` | boolean | `false` | Remove the card border entirely |
| `hide_title` | boolean | `false` | Hide the card title bar |
| `custom_title` | string | — | Replace the default title with custom text |
| `border_radius` | number | `4.5` | Corner radius of the card in px |

**Color override examples:**

```markdown
<!-- Custom colors (hex values, no # prefix) -->
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&title_color=ff6e96&text_color=a4ffff&bg_color=282a36&border_color=ff6e96)

<!-- No border, custom title -->
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&hide_border=true&custom_title=My+Coding+Journey)

<!-- Fully transparent background -->
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&bg_color=00000000&hide_border=true)
```

---

## Deployment

### Node.js (VPS / Local)

```bash
# 1. Clone and install
git clone <your-repo>
cd gh-stats
npm install

# 2. Build
npm run build

# 3. Run (set GITHUB_TOKEN first)
GITHUB_TOKEN=ghp_xxxxxxxxxxxx npm start
```

For development with live reload:
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxx npm run dev
```

The server starts on port `3000` by default. Set `PORT` to change it.

### Docker

```bash
# Build
docker build -t gh-stats .

# Run
docker run -e GITHUB_TOKEN=ghp_xxxxxxxxxxxx -p 3000:3000 gh-stats
```

### Cloudflare Workers

Free tier includes 100,000 requests/day.

```bash
# 1. Install Wrangler (if not already installed)
npm install -g wrangler
wrangler login

# 2. Store your token as a secret (never commit it to wrangler.toml)
wrangler secret put GITHUB_TOKEN

# 3. Deploy
npm run deploy
```

Your card URL will be:
```
https://gh-stats.<your-subdomain>.workers.dev/api/stats?username=eru123
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GITHUB_TOKEN` | **Yes** | GitHub Personal Access Token. Needs `read:user` and `public_repo` scopes. Generate at: GitHub → Settings → Developer settings → Personal access tokens |
| `PORT` | No | Port for the Node.js server (default: `3000`) |
| `CACHE_SECONDS` | No | Override the default cache TTL for all card types |
| `WHITELIST` | No | Comma-separated list of allowed usernames. If set, all other usernames are rejected. Useful for self-hosted instances. Example: `eru123,octocat` |
