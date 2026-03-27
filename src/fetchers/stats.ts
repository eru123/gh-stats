import { CustomError } from '../utils/errors'
import { calculateRank } from '../utils/rank'
import { GitHubStats } from '../types'

export async function fetchStats(username: string, options: { 
  token: string
  include_all_commits?: boolean 
}): Promise<GitHubStats> {
  const query = `
    query($login: String!) {
      user(login: $login) {
        name
        login
        followers { totalCount }
        contributionsCollection {
          totalCommitContributions
          totalPullRequestReviewContributions
        }
        pullRequests: pullRequests(first: 1) { totalCount }
        issues: issues(first: 1) { totalCount }
        repositories(first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}) {
          nodes {
            stargazers { totalCount }
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

  const totalStars = user.repositories.nodes.reduce((acc: number, repo: any) => acc + (repo.stargazers?.totalCount || 0), 0)
  
  let totalCommits = user.contributionsCollection.totalCommitContributions

  if (options.include_all_commits) {
    try {
      const searchRes = await fetch(`https://api.github.com/search/commits?q=author:${username}`, {
        headers: {
          'Authorization': `Bearer ${options.token}`,
          'User-Agent': 'gh-stats',
          'Accept': 'application/vnd.github.cloak-preview'
        }
      })
      if (searchRes.ok) {
        const searchJson = await searchRes.json() as any;
        if (typeof searchJson.total_count === 'number') {
          totalCommits = searchJson.total_count
        }
      }
    } catch (e) {
      // fallback to GraphQL commits
    }
  }

  const statObj = {
    commits: totalCommits,
    stars: totalStars,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    followers: user.followers.totalCount
  }
  
  const rank = calculateRank(statObj)

  return {
    name: user.name || user.login,
    totalStars,
    totalCommits,
    totalPRs: user.pullRequests.totalCount,
    totalIssues: user.issues.totalCount,
    totalReviews: user.contributionsCollection.totalPullRequestReviewContributions,
    followers: user.followers.totalCount,
    rank
  }
}
