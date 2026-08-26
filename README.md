# gh-stats

[![PayPal](https://img.shields.io/badge/Donate-PayPal-0070ba?logo=paypal&logoColor=white)](https://paypal.me/ja1030)

A self-hosted GitHub README stats card generator. Drop-in replacement for `anuraghazra/github-readme-stats` **and** `DenverCoder1/github-readme-streak-stats` that runs on **Node.js/Express** or **Cloudflare Workers** from a single codebase.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Cards](#cards)
  - [Stats Card](#stats-card)
  - [Top Languages Card](#top-languages-card)
  - [Repo Pin Card](#repo-pin-card)
  - [Streak Stats Card](#streak-stats-card)
  - [ASCII Art Card](#ascii-art-card)
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
![Streak Stats](https://gh-stats.skiddph.com/api/streak?username=YOUR_USERNAME)
```

---

## Cards

### Stats Card

**Endpoint:** `GET /api/stats`

Displays your GitHub stats: total stars, commits, PRs, issues, followers, contributed-to count, and an animated rank badge.

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&theme=dark&show_icons=true)
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

### Streak Stats Card

**Endpoint:** `GET /api/streak`

A native reimplementation of [`DenverCoder1/github-readme-streak-stats`](https://github.com/DenverCoder1/github-readme-streak-stats) inside this repo — no PHP, no second service. Shows your **total contributions**, **current streak**, and **longest streak** (with date ranges) in the classic three-column layout with the flame-in-a-ring centerpiece.

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123)
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `username` | string | **required** | GitHub username. `user=` is accepted as an alias (upstream compatibility) |
| `mode` | `daily` \| `weekly` | `daily` | `weekly` counts consecutive Sun–Sat weeks with ≥1 contribution |
| `exclude_days` | string | — | Comma-separated days to skip: `Sun,Mon,Tue,Wed,Thu,Fri,Sat`. Excluded days never break a streak and their contributions aren't counted |
| `exclude_dates` | string | — | Dates to skip: `2026-01-01`, ranges `2026-03-01..2026-03-15`, or annual `12-25` (every year) |
| `date_format` | string | `M j[, Y]` | PHP-style format for the date ranges: `d j D l S n m M F Y y`. Text in `[brackets]` is only shown when the date's year ≠ current year |
| `timezone` | string | `UTC` | IANA zone (`Asia/Manila`) or fixed offset (`+08:00`, `-5`). Determines which day counts as "today" for the current streak |
| `starting_year` | number | account creation | First year to scan for the longest streak / totals (max 25 years back) |
| `type` | `svg` \| `json` | `svg` | `json` returns the raw streak data instead of an image |
| `locale` | string | — | Locale for date rendering when `date_format` is absent, e.g. `de`, `fil-PH` |
| `card_width` | number | `495` | Card width in px (clamped to 320–800) |
| `disable_animations` | boolean | `false` | Turn off the fade-in animation |
| `hide_title` | boolean | `true` | **Inverted vs other cards** — the streak card has no title by default (matches upstream). Pass `hide_title=false` to show one |
| `custom_title` | string | `<user> GitHub Streak` | Title text when shown |
| `theme`, `hide_border`, `border_radius`, `bg_color`, `border_color`, `text_color`, `title_color` | — | — | All [Common Options](#common-options) work |
| `background`, `border`, `stroke`, `ring`, `fire`, `currStreakNum`, `currStreakLabel`, `sideNums`, `sideLabels`, `dates` | hex | theme | Upstream color params (with or without `#`) — see [migration](#migrating-from-github-readme-streak-stats) |

The card is cached for **6 hours** per unique URL by default (override with the `CACHE_SECONDS` env var) so the current streak stays reasonably fresh without hammering the GitHub API.

**Examples:**

```markdown
<!-- Basic streak card -->
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123)

<!-- Dark theme, weekends excluded -->
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&theme=dark&exclude_days=Sat,Sun)

<!-- Weekly mode, Philippine timezone -->
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&mode=weekly&timezone=Asia/Manila)

<!-- Skip a vacation + annual holidays, long date format -->
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&exclude_dates=2026-05-01..2026-05-15,12-25&date_format=l,+F+jS,+Y)

<!-- Upstream-style explicit colors: fire, ring, and per-section text -->
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&background=141321&border=e4e2e2&ring=1f1b2e&fire=ff6e96&currStreakNum=ffffff&sideNums=fe428e&currStreakLabel=a9fef7&sideLabels=a9fef7&dates=a9fef7)

<!-- Raw JSON data for your own tooling -->
curl "https://gh-stats.skiddph.com/api/streak?username=eru123&type=json"
```

```json
{
  "totalContributions": 14404,
  "currentStreak":  { "length": 79, "start": "2026-06-08", "end": "2026-08-25" },
  "longestStreak":  { "length": 85, "start": "2022-01-18", "end": "2022-04-12" },
  "startingYear": 2018,
  "mode": "daily"
}
```

#### How it works

1. **Data source** — the card reads GitHub's official GraphQL API (`contributionsCollection → contributionCalendar`), the same calendar GitHub renders on your profile. Two requests per uncached render: one to get your account's creation year, then **one batched query** with a per-year alias from that year (or `starting_year`) to the current year — so even a 10-year account is a single round trip. It uses the same `GITHUB_TOKEN` as every other card (`read:user` scope is enough) and respects `WHITELIST`.
2. **Streak math** — days are walked in UTC day buckets. A day with ≥1 contribution extends a run; an empty day ends it. Two conveniences: *today doesn't count against you* (the day isn't over — an empty today falls back to yesterday before checking), and *excluded days are transparent* (they're skipped entirely, never breaking a run, whether or not you contributed that day). `mode=weekly` buckets days into Sun–Sat weeks first, then applies the same logic to weeks. Excluded days'/dates' contributions are subtracted from the total.
3. **Rendering** — pure string-built SVG, no DOM/rasterizer, so it runs identically on Node.js and Cloudflare Workers (no Node-only APIs — this is why it deploys to the same Worker as the rest of gh-stats). It shares the theme engine with all other cards, so `theme=tokyonight` looks consistent across your stats, langs, pin, and streak cards.
4. **Caching** — responses are cached per full URL (6 h default): in the Cloudflare Cache API on Workers, in memory on Node. GitHub itself is only hit on cache misses, and the browser gets `Cache-Control: public, max-age` headers too.

#### Migrating from github-readme-streak-stats

Swap the host and path, keep the rest of the URL — `user=` works as-is:

```markdown
<!-- before -->
![Streak](https://streak-stats.demolab.com/?user=eru123&theme=dark&date_format=M+j[%2C+Y])

<!-- after -->
![Streak](https://gh-stats.skiddph.com/api/streak?user=eru123&theme=dark&date_format=M+j[%2C+Y])
```

Option compatibility at a glance:

| Upstream option | Status here |
|---|---|
| `user` | ✅ accepted as-is (alias of `username`) |
| `date_format` (incl. `[brackets]`) | ✅ same PHP-style tokens: `d j D l S n m M F Y y` |
| `mode=daily\|weekly`, `exclude_days`, `exclude_dates` (incl. ranges & annual dates) | ✅ supported |
| `timezone`, `card_width`, `border_radius`, `hide_border`, `disable_animations` | ✅ supported |
| `background`, `border`, `stroke`, `ring`, `fire`, `currStreakNum`, `currStreakLabel`, `sideNums`, `sideLabels`, `dates` | ✅ supported, same meanings |
| `theme` | ⚠️ different names — this repo ships `default`, `dark`, `radical`, `tokyonight`, `dracula`, `gruvbox`, `onedark`, `transparent` (shared with all cards). Recreate any upstream theme exactly with the color params above |
| `locale` | ⚠️ dates only (e.g. `de`, `fil-PH`); card labels remain English |
| `type=png` | ❌ not supported (no rasterizer — SVG keeps the service dependency-free). `type=json` is supported |
| `exclude_days_label` and other label overrides | ❌ labels are fixed English: *Total Contributions / Current Streak / Longest Streak* |

---

### ASCII Art Card

**Endpoint:** `GET /api/ascii`

Converts any text into a pixel block SVG card using a built-in 5×7 bitmap font. No GitHub token required — works standalone.

```markdown
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123&theme=dark)
```

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `text` | string | **required** | Text to render. Max 50 characters. Auto-converted to uppercase. |
| `style` | `block` \| `outline` \| `shadow` \| `neon` | `block` | Visual rendering style |
| `size` | `sm` \| `md` \| `lg` \| `xl` | `md` | Block size preset (sets block_w, block_h, gap, char_spacing together) |
| `color` | hex | theme title color | Color of the pixel blocks (without `#`) |
| `block_w` | number | preset | Width of each pixel block in px — overrides `size` preset |
| `block_h` | number | preset | Height of each pixel block in px — overrides `size` preset |
| `gap` | number | preset | Gap between pixel blocks in px — overrides `size` preset |
| `char_spacing` | number | preset | Extra space between characters in px — overrides `size` preset |
| `block_radius` | number | `2` | Border radius of each pixel block |

**Size presets:**

| `size` | `block_w` | `block_h` | `gap` | `char_spacing` |
|---|---|---|---|---|
| `sm` | 10 | 7 | 2 | 6 |
| `md` _(default)_ | 18 | 12 | 3 | 10 |
| `lg` | 24 | 16 | 4 | 14 |
| `xl` | 32 | 22 | 5 | 18 |

**Style previews:**

| `style` | Effect |
|---|---|
| `block` | Solid filled pixel blocks |
| `outline` | Hollow blocks — only the border is drawn |
| `shadow` | Solid blocks with a soft offset shadow behind them |
| `neon` | Solid blocks with an SVG glow filter — best on dark backgrounds |

> **Supported characters:** `A–Z`, `0–9`, and `` ! ? . , : ; - _ + = * / # @ % & ( ) [ ] < > ^ ~ ' " ` | space ``
> Lowercase input is auto-uppercased. Unsupported characters render as blank space.

**Examples:**

```markdown
<!-- Default block style, dark theme -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=HELLO&theme=dark)

<!-- Outline style — hollow blocks -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123&style=outline&theme=dark&color=58a6ff)

<!-- Shadow style — blocks with a soft drop shadow -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123&style=shadow&theme=dark&color=ff6e96)

<!-- Neon style — glowing blocks (best on dark backgrounds) -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123&style=neon&bg_color=0d1117&color=79ff97&hide_border=true)

<!-- Large size preset -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123&size=lg&theme=tokyonight)

<!-- Small size, compact spacing -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=GH-STATS&size=sm&theme=dracula)

<!-- XL neon on dark — maximum impact -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=CODE&size=xl&style=neon&bg_color=141321&color=fe428e&hide_border=true)

<!-- Outline + rounded blocks, transparent background -->
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=HELLO&style=outline&bg_color=00000000&hide_border=true&block_radius=6)
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
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&theme=onedark)
```

> **Tip:** Use `theme=transparent` for cards that adapt to GitHub's light/dark mode switching.

---

## Common Options

These parameters work on **all cards** (on the streak card, `hide_title` is inverted — the title is hidden by default, pass `hide_title=false` to show it):

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

```cmd
:: Windows CMD
set GITHUB_TOKEN=ghp_yourTokenHere && npm run dev
```

```powershell
# PowerShell
$env:GITHUB_TOKEN="ghp_yourTokenHere"; npm run dev
```

```bash
# bash / Git Bash / macOS / Linux
GITHUB_TOKEN=ghp_yourTokenHere npm run dev
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
