import type { SiteReportData } from "./site-report";
import type { SiteTotals } from "./site-totals";

export interface StatsPeriod {
  since: Date;
  until: Date;
}

export interface SiteStatsReader {
  totals(siteId: string, period: StatsPeriod): Promise<SiteTotals>;
}

export interface SiteReportReader {
  report(siteId: string, period: StatsPeriod): Promise<SiteReportData>;
}
