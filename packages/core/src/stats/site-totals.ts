export interface SiteTotals {
  visits: number;
  sectionAttentionMs: number;
  repoClicks: number;
  topProject: string | null;
}

export interface SiteOverview {
  visits: number;
  averageAttentionMs: number;
  repoClicks: number;
  topProject: string | null;
}
