import { CustomError } from '../utils/errors'
import { RepoData } from '../types'

export async function fetchRepo(username: string, repo: string, options: { token: string }): Promise<RepoData> {
  const headers = {
    'Authorization': `Bearer ${options.token}`,
    'User-Agent': 'gh-stats',
    'Accept': 'application/vnd.github.v3+json'
  }

  const res = await fetch(`https://api.github.com/repos/${username}/${repo}`, {
    method: 'GET',
    headers
  }).catch((e) => {
    throw new CustomError('Network error connecting to GitHub', 'NETWORK_ERROR')
  })

  if (!res.ok) {
    if (res.status === 401) throw new CustomError('Invalid GitHub token', 'INVALID_TOKEN')
    if (res.status === 403 || res.status === 429) throw new CustomError('API rate limit exceeded', 'RATE_LIMIT')
    if (res.status === 404) throw new CustomError(`Repository "${username}/${repo}" not found`, 'USER_NOT_FOUND')
    throw new CustomError(`GitHub API error: ${res.status}`, 'SERVER_ERROR')
  }

  const data = await res.json() as any

  let primaryLanguage = null;
  if (data.language) {
    // Fetch language color manually or have a fallback?
    // Let's use a fallback for now.
    // GitHub API REST responses for repo don't include language color. 
    // They just have `language` as string.
    primaryLanguage = {
      name: data.language,
      color: '#4c71f2' // Default fallback color
    }
  }

  return {
    name: data.name,
    nameWithOwner: data.full_name,
    description: data.description,
    stargazers: data.stargazers_count,
    forks: data.forks_count,
    primaryLanguage,
    isArchived: data.archived
  }
}
