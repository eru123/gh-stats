export function calculateRank(stats: {
  commits: number
  stars: number
  prs: number
  issues: number
  followers: number
}): { level: string; percentile: number } {
  // Rough approximation of github-readme-stats ranking weights
  const COMMITS_OFFSET = 300;
  const CONTRIBS_OFFSET = 4.2;
  const STARS_OFFSET = 2.1;
  const PRS_OFFSET = 2.9;
  const ISSUES_OFFSET = 2.4;
  const FOLLOWERS_OFFSET = 1.9;
  
  const allOffsets = CONTRIBS_OFFSET + STARS_OFFSET + PRS_OFFSET + ISSUES_OFFSET + FOLLOWERS_OFFSET;

  // 1. Exponential CDF
  const exponential_cdf = (x: number) => 1 - 2 ** -x;
  // 2. Log normal distribution CDF (approximate, avoiding heavy math for simplicity)
  const log_normal_cdf = (x: number) => x / (1 + x);

  // Apply formulas
  const commits_val = exponential_cdf(stats.commits / (COMMITS_OFFSET * 2.5));
  const stars_val = log_normal_cdf(stats.stars / 100); 
  const prs_val = exponential_cdf(stats.prs / (COMMITS_OFFSET * 0.5));
  const issues_val = exponential_cdf(stats.issues / (COMMITS_OFFSET * 0.5));
  const followers_val = log_normal_cdf(stats.followers / 100);

  let score = 
    commits_val * (CONTRIBS_OFFSET / allOffsets) +
    stars_val * (STARS_OFFSET / allOffsets) +
    prs_val * (PRS_OFFSET / allOffsets) +
    issues_val * (ISSUES_OFFSET / allOffsets) +
    followers_val * (FOLLOWERS_OFFSET / allOffsets);

  const percentile = (1 - score) * 100;

  // Level thresholds: S (top 1%), A+ (12.5%), A (25%), A- (37.5%), B+ (50%), B (62.5%), B- (75%), C+ (87.5%), C (everyone else)
  let level = 'C';
  if (percentile <= 1) level = 'S';
  else if (percentile <= 12.5) level = 'A+';
  else if (percentile <= 25) level = 'A';
  else if (percentile <= 37.5) level = 'A-';
  else if (percentile <= 50) level = 'B+';
  else if (percentile <= 62.5) level = 'B';
  else if (percentile <= 75) level = 'B-';
  else if (percentile <= 87.5) level = 'C+';
  
  return { level, percentile };
}
