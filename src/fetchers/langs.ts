import { CustomError } from '../utils/errors'
import { LangData } from '../types'

export async function fetchTopLangs(username: string, options: {
  token: string
  exclude_repo?: string[]
  langs_count?: number
  hide?: string[]
}): Promise<LangData> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {direction: DESC, field: STARGAZERS}) {
          nodes {
            name
            languages(first: 10, orderBy: {direction: DESC, field: SIZE}) {
              edges {
                size
                node {
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `

  const headers = {
    'Authorization': `Bearer ${options.token}`,
    'User-Agent': 'gh-stats',
    'Content-Type': 'application/json'
  }

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: { login: username } })
  }).catch((e) => {
    throw new CustomError('Network error connecting to GitHub', 'NETWORK_ERROR')
  })

  if (!res.ok) {
    if (res.status === 401) throw new CustomError('Invalid GitHub token', 'INVALID_TOKEN')
    if (res.status === 403 || res.status === 429) throw new CustomError('API rate limit exceeded', 'RATE_LIMIT')
    throw new CustomError(`GitHub API error: ${res.status}`, 'SERVER_ERROR')
  }

  const json = await res.json() as any

  if (json.errors) {
    if (json.errors[0]?.type === 'NOT_FOUND') {
      throw new CustomError(`User "${username}" not found`, 'USER_NOT_FOUND')
    }
    throw new CustomError(json.errors[0]?.message || 'GitHub API returned errors', 'SERVER_ERROR')
  }

  const user = json.data.user
  if (!user) {
    throw new CustomError(`User "${username}" not found`, 'USER_NOT_FOUND')
  }

  let repos = user.repositories.nodes
  
  if (options.exclude_repo) {
    const excludeSet = new Set(options.exclude_repo.map(r => r.toLowerCase()))
    repos = repos.filter((r: any) => !excludeSet.has(r.name.toLowerCase()))
  }

  const stats: LangData = {}

  repos.forEach((repo: any) => {
    repo.languages.edges.forEach((edge: any) => {
      const name = edge.node.name
      const size = edge.size
      const color = edge.node.color || '#cccccc'

      if (options.hide) {
        const hideSet = new Set(options.hide.map(h => h.toLowerCase()))
        if (hideSet.has(name.toLowerCase())) return
      }

      if (!stats[name]) {
         stats[name] = { color, size: 0, count: 0 }
      }
      stats[name].size += size
      stats[name].count += 1
    })
  })

  const count = options.langs_count || 5

  const sortedStats = Object.keys(stats)
    .sort((a, b) => stats[b].size - stats[a].size)
    .slice(0, count)
    .reduce((acc: LangData, key: string) => {
      acc[key] = stats[key]
      return acc
    }, {})

  return sortedStats
}
