# gh-stats — Examples

Every endpoint and variation, using the live instance at `https://gh-stats.skiddph.com` with the [`eru123`](https://github.com/eru123) account and its real repositories.

Copy any snippet straight into a README — they are standard Markdown images.

---

## Table of Contents

- [Stats Card](#stats-card)
- [Top Languages Card](#top-languages-card)
- [Repo Pin Card](#repo-pin-card)
- [Streak Stats Card](#streak-stats-card)
- [Typing SVG](#typing-svg)
- [Badges](#badges)
- [YouTube Cards](#youtube-cards)
- [ASCII Art Card](#ascii-art-card)
- [Full Profile Combo](#full-profile-combo)

---

## Stats Card

`GET /api/stats`

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123)
```

With icons and a theme:

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&theme=dark&show_icons=true)
```

Hide specific stats (`stars`, `commits`, `prs`, `issues`, `followers`, `contribs`):

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&theme=tokyonight&show_icons=true&hide=issues,contribs)
```

Hide the rank badge, custom ring color, all-time commits, long numbers:

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&hide_rank=true&ring_color=ff6e96&include_all_commits=true&number_format=long)
```

Custom title, no border, full color override:

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&custom_title=Jericho%27s+Stats&title_color=ff6e96&text_color=a9fef7&icon_color=f8d847&bg_color=141321&border_color=fe428e&hide_border=true)
```

Transparent background (adapts to GitHub light/dark):

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&theme=transparent&hide_border=true)
```

No title, rounded corners:

```markdown
![Stats](https://gh-stats.skiddph.com/api/stats?username=eru123&hide_title=true&border_radius=10)
```

---

## Top Languages Card

`GET /api/top-langs`

```markdown
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123)
```

All four layouts — `normal`, `compact`, `donut`, `pie`:

```markdown
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=compact&theme=dark)
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=donut&theme=tokyonight)
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=pie&theme=dracula)
```

More languages, hide markup languages:

```markdown
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&langs_count=8&hide=html,css)
```

Exclude specific repositories from the count:

```markdown
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&exclude_repo=skiddph.com,jericho.work&theme=gruvbox)
```

Progress bars off, transparent:

```markdown
![Langs](https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=normal&hide_progress=true&bg_color=00000000&hide_border=true)
```

---

## Repo Pin Card

`GET /api/pin`

```markdown
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=workgrid-studio)
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=jericho.work)
```

With owner prefix and themes:

```markdown
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=workgrid-studio&show_owner=true&theme=radical)
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=vue-skidd&show_owner=true&theme=onedark)
```

Custom colors:

```markdown
![Repo](https://gh-stats.skiddph.com/api/pin?username=eru123&repo=AppStarter&title_color=70a5fd&text_color=38bdae&icon_color=70a5fd&bg_color=1a1b27)
```

---

## Streak Stats Card

`GET /api/streak`

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123)
```

Themes (same shared palette as every other card):

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&theme=dark)
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&theme=tokyonight)
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&theme=dracula)
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&theme=gruvbox)
```

Weekends excluded (they never break the streak and aren't counted):

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&exclude_days=Sat,Sun&theme=dark)
```

Weekly streaks in Philippine time:

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&mode=weekly&timezone=Asia/Manila)
```

Skip a vacation and annual holidays, long date format:

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&exclude_dates=2025-05-01..2025-05-15,12-25,01-01&date_format=l,+F+jS,+Y)
```

Scan only recent years, wider card, no animations:

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&starting_year=2022&card_width=600&disable_animations=true)
```

With a title (hidden by default, matching upstream):

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?username=eru123&hide_title=false&custom_title=Jericho%27s+Streak&theme=onedark)
```

Upstream-style explicit colors (drop-in from `github-readme-streak-stats` docs):

```markdown
![Streak](https://gh-stats.skiddph.com/api/streak?user=eru123&background=141321&border=e4e2e2&stroke=e4e2e2&ring=1f1b2e&fire=ff6e96&currStreakNum=ffffff&sideNums=fe428e&currStreakLabel=a9fef7&sideLabels=a9fef7&dates=a9fef7)
```

Raw JSON instead of an image:

```
https://gh-stats.skiddph.com/api/streak?username=eru123&type=json
```

---

## Typing SVG

`GET /api/typing`

```markdown
![Typing](https://gh-stats.skiddph.com/api/typing?lines=Hello,+I+am+Jericho;Full--stack+developer;Building+things+at+skiddph.com)
```

Multiline typing (lines stack as they complete):

```markdown
![Typing](https://gh-stats.skiddph.com/api/typing?lines=Type+script;Compile+everywhere;Ship+on+Workers&multiline=true&vCenter=true&height=120)
```

Custom font, size, colors, timing:

```markdown
![Typing](https://gh-stats.skiddph.com/api/typing?lines=Self--hosted;No+third--party+CDNs&font=Fira+Code&size=24&color=fe428e&background=141321&duration=2500&pause=1000&width=520)
```

Centered, plays once and freezes:

```markdown
![Typing](https://gh-stats.skiddph.com/api/typing?lines=One+shot+message&center=true&vCenter=true&repeat=false&width=400&height=60)
```

Custom separator (when lines contain semicolons):

```markdown
![Typing](https://gh-stats.skiddph.com/api/typing?lines=first|second|third&separator=%7C)
```

---

## Badges

### Static badges

`GET /api/badge/<label>-<message>-<color>` — literal dashes inside label/message as `--`:

```markdown
![Badge](https://gh-stats.skiddph.com/api/badge/build-passing-brightgreen)
![Badge](https://gh-stats.skiddph.com/api/badge/deploy-live-success)
![Badge](https://gh-stats.skiddph.com/api/badge/made--with-TypeScript-blue)
```

All five styles — `flat`, `plastic`, `flat-square`, `for-the-badge`, `social`:

```markdown
![flat](https://gh-stats.skiddph.com/api/badge/version-1.0.0-blue)
![plastic](https://gh-stats.skiddph.com/api/badge/version-1.0.0-blue?style=plastic)
![flat-square](https://gh-stats.skiddph.com/api/badge/version-1.0.0-blue?style=flat-square)
![for-the-badge](https://gh-stats.skiddph.com/api/badge/version-1.0.0-blue?style=for-the-badge)
![social](https://gh-stats.skiddph.com/api/badge/follow-eru123-ff6e96?style=social&logo=github)
```

Icons — octicons, simple-icons, `logoColor`, `labelColor`, `logoWidth`:

```markdown
![Badge](https://gh-stats.skiddph.com/api/badge/deployed-on-Workers-orange?logo=cloud&logoColor=f6821f)
![Badge](https://gh-stats.skiddph.com/api/badge/stack-TypeScript-3178c6?logo=typescript&logoColor=ffffff&style=for-the-badge)
![Badge](https://gh-stats.skiddph.com/api/badge/api-node.ts-339933?logo=dotnet&logoColor=purple)
![Badge](https://gh-stats.skiddph.com/api/badge/editor-VS--Code-0078d7?logo=visualstudiocode&logoColor=white&labelColor=2b2b2b&logoWidth=18)
```

### Query-string badges (shields `static/v1` format)

```markdown
![Badge](https://gh-stats.skiddph.com/api/badge/static/v1?label=hosted%20at&message=skiddph.com&color=blueviolet&style=flat-square)
```

### Dynamic badge formatter

`GET /api/badge/dynamic/json` — live values from any JSON endpoint, here from the GitHub API itself:

```markdown
![Stars](https://gh-stats.skiddph.com/api/badge/dynamic/json?url=https://api.github.com/repos/eru123/workgrid-studio&query=$.stargazers_count&label=workgrid-studio%20stars&suffix=%20stars&color=yellow&style=flat-square&logo=star&logoColor=yellow)
```

```markdown
![Forks](https://gh-stats.skiddph.com/api/badge/dynamic/json?url=https://api.github.com/repos/eru123/jericho.work&query=$.forks_count&label=jericho.work%20forks&style=for-the-badge&color=blue)
```

```markdown
![Issues](https://gh-stats.skiddph.com/api/badge/dynamic/json?url=https://api.github.com/repos/eru123/vue-skidd&query=$.open_issues_count&label=vue-skidd%20issues&color=critical&logo=issue-opened&logoColor=white)
```

Nested paths and arrays work too (`$.a.b[0].c`):

```markdown
![License](https://gh-stats.skiddph.com/api/badge/dynamic/json?url=https://api.github.com/repos/eru123/repopact&query=$.license.spdx_id&label=license&color=blue)
```

### Shields proxy (everything else)

Any other shields path proxies to `img.shields.io` with custom icons injected:

```markdown
![Stars](https://gh-stats.skiddph.com/api/badge/github/stars/eru123/workgrid-studio?style=social&label=Star)
![Forks](https://gh-stats.skiddph.com/api/badge/github/forks/eru123/workgrid-studio?style=social&label=Fork)
![Issues](https://gh-stats.skiddph.com/api/badge/github/issues-raw/eru123/jericho.work?style=flat-square&label=issues)
![Last commit](https://gh-stats.skiddph.com/api/badge/github/last-commit/eru123/skiddph.com?style=flat-square)
```

### Custom icons

Serve your own icon by adding `icons/<slug>.svg` to the repo configured in `ICON_REPO`, then:

```markdown
![Badge](https://gh-stats.skiddph.com/api/badge/custom--icon-supported-blue?logo=my-icon&logoColor=ffffff)
```

---

## YouTube Cards

`GET /api/videos` — replace the channel with your own `channel_id` or `playlist_id`:

```markdown
![Videos](https://gh-stats.skiddph.com/api/videos?channel_id=UCipSxT24I0E34v-lZ6PvjHg&width=250&max_videos=3)
```

Dark styling with wrapped titles:

```markdown
![Videos](https://gh-stats.skiddph.com/api/videos?channel_id=UCipSxT24I0E34v-lZ6PvjHg&width=280&border_radius=10&background_color=0d1117&title_color=ffffff&stats_color=8b949e&max_title_lines=2&max_videos=4)
```

By playlist, filtering out shorts/community uploads:

```markdown
![Videos](https://gh-stats.skiddph.com/api/videos?playlist_id=PLME_2BhKjxUA&max_videos=6&filter=Shorts%7CCommunity)
```

---

## ASCII Art Card

`GET /api/ascii`

```markdown
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123)
```

Styles — `block`, `outline`, `shadow`, `neon`:

```markdown
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123&style=outline&theme=dark&color=58a6ff)
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=ERU123&style=shadow&theme=dark&color=ff6e96)
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=SKIDDPH&style=neon&bg_color=0d1117&color=79ff97&hide_border=true)
```

Size presets — `sm`, `md`, `lg`, `xl`:

```markdown
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=JERICHO&size=lg&theme=tokyonight)
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=CODE&size=xl&style=neon&bg_color=141321&color=fe428e&hide_border=true)
```

Fully transparent:

```markdown
![ASCII](https://gh-stats.skiddph.com/api/ascii?text=HELLO&style=outline&bg_color=00000000&hide_border=true&block_radius=6)
```

---

## Full Profile Combo

A complete, copy-pasteable profile section using everything together:

```markdown
<div align="center">
  <img src="https://gh-stats.skiddph.com/api/typing?lines=Hey,+I+am+Jericho;Full--stack+developer;Building+SaaS+at+skiddph.com&font=Fira+Code&duration=2500&pause=900&width=560" alt="typing" />
</div>

<div align="center">
  <a href="https://github.com/eru123?tab=followers">
    <img src="https://gh-stats.skiddph.com/api/badge/follow-eru123-ff6e96?style=social&logo=github" alt="follow" />
  </a>
  <img src="https://gh-stats.skiddph.com/api/badge/static/v1?label=hosted%20at&message=skiddph.com&color=blueviolet&style=flat-square" alt="hosted" />
  <img src="https://gh-stats.skiddph.com/api/badge/dynamic/json?url=https://api.github.com/repos/eru123/workgrid-studio&query=$.stargazers_count&label=workgrid-studio&suffix=%20stars&color=yellow&style=flat-square&logo=star&logoColor=yellow" alt="stars" />
</div>

<div align="center">
  <img src="https://gh-stats.skiddph.com/api/stats?username=eru123&theme=tokyonight&show_icons=true" height="165" alt="stats" />
  <img src="https://gh-stats.skiddph.com/api/streak?username=eru123&theme=tokyonight" height="165" alt="streak" />
</div>

<div align="center">
  <img src="https://gh-stats.skiddph.com/api/top-langs?username=eru123&layout=compact&theme=tokyonight" height="165" alt="langs" />
</div>

### Featured work

<table>
  <tr>
    <td><img src="https://gh-stats.skiddph.com/api/pin?username=eru123&repo=workgrid-studio&theme=tokyonight" alt="workgrid-studio" /></td>
    <td><img src="https://gh-stats.skiddph.com/api/pin?username=eru123&repo=jericho.work&theme=tokyonight" alt="jericho.work" /></td>
  </tr>
  <tr>
    <td><img src="https://gh-stats.skiddph.com/api/pin?username=eru123&repo=vue-skidd&theme=tokyonight" alt="vue-skidd" /></td>
    <td><img src="https://gh-stats.skiddph.com/api/pin?username=eru123&repo=AppStarter&theme=tokyonight" alt="AppStarter" /></td>
  </tr>
</table>

<div align="center">
  <img src="https://gh-stats.skiddph.com/api/ascii?text=SKIDDPH&style=neon&bg_color=1a1b27&color=70a5fd&hide_border=true" alt="ascii" />
</div>
```

---

## Notes

- All URLs above are **live** on `https://gh-stats.skiddph.com` — same instance, single Worker.
- Responses are cached per URL (6 h for stats/streak/badges/videos, 24 h for the rest).
- Errors render as SVG images (a red badge for `/api/badge/...`), never broken images.
- Everything runs from one codebase — Node.js/Express or Cloudflare Workers. See the [README](README.md) for deployment, tokens, and the full parameter reference.
