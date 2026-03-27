export function calculateRank(stats: {
  commits: number
  stars: number
  prs: number
  issues: number
  followers: number
}): { level: string; percentile: number } {
  // Spec weights: commits 45%, stars 35%, PRs 10%, issues 5%, followers 5%
  const COMMITS_WEIGHT   = 0.45
  const STARS_WEIGHT     = 0.35
  const PRS_WEIGHT       = 0.10
  const ISSUES_WEIGHT    = 0.05
  const FOLLOWERS_WEIGHT = 0.05

  // Scaling constants: value at which each metric reaches score ~0.5
  const COMMITS_MEDIAN   = 300
  const STARS_MEDIAN     = 50
  const PRS_MEDIAN       = 30
  const ISSUES_MEDIAN    = 25
  const FOLLOWERS_MEDIAN = 50

  const exponential_cdf = (x: number) => 1 - 2 ** -x
  const log_normal_cdf  = (x: number) => x / (1 + x)

  const score =
    exponential_cdf(stats.commits   / COMMITS_MEDIAN)   * COMMITS_WEIGHT   +
    log_normal_cdf (stats.stars     / STARS_MEDIAN)     * STARS_WEIGHT     +
    exponential_cdf(stats.prs       / PRS_MEDIAN)       * PRS_WEIGHT       +
    exponential_cdf(stats.issues    / ISSUES_MEDIAN)    * ISSUES_WEIGHT    +
    log_normal_cdf (stats.followers / FOLLOWERS_MEDIAN) * FOLLOWERS_WEIGHT

  const percentile = (1 - score) * 100

  // S (top 1%), A+ (12.5%), A (25%), A- (37.5%), B+ (50%), B (62.5%), B- (75%), C+ (87.5%), C (everyone else)
  let level = 'C'
  if      (percentile <=  1)   level = 'S'
  else if (percentile <= 12.5) level = 'A+'
  else if (percentile <= 25)   level = 'A'
  else if (percentile <= 37.5) level = 'A-'
  else if (percentile <= 50)   level = 'B+'
  else if (percentile <= 62.5) level = 'B'
  else if (percentile <= 75)   level = 'B-'
  else if (percentile <= 87.5) level = 'C+'

  return { level, percentile }
}
