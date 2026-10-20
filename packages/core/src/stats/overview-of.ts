import type { SiteOverview, SiteTotals } from "./site-totals";

export function overviewOf(totals: SiteTotals): SiteOverview {
  return {
    visits: totals.visits,
    averageAttentionMs: totals.visits === 0 ? 0 : Math.round(totals.sectionAttentionMs / totals.visits),
    repoClicks: totals.repoClicks,
    topProject: totals.topProject,
  };
}
