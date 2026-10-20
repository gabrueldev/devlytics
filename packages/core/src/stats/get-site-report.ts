import { ownedSite, type SiteCatalog } from "../sites";
import type { SiteReportReader } from "./ports";
import type { SiteReport } from "./site-report";

export const reportPeriods = [7, 30, 90] as const;
export type ReportPeriod = (typeof reportPeriods)[number];

const dayMs = 24 * 60 * 60 * 1000;

export function getSiteReport(deps: { sites: SiteCatalog; reports: SiteReportReader; now: () => Date }) {
  return async (userId: string, siteId: string, days: ReportPeriod): Promise<SiteReport> => {
    const site = await ownedSite(deps.sites, userId, siteId);
    const until = deps.now();
    const since = new Date(until.getTime() - days * dayMs);
    const data = await deps.reports.report(site.id, { since, until });

    return {
      ...data,
      site: { id: site.id, name: site.name, domain: site.domain },
      period: { days, since: since.toISOString(), until: until.toISOString() },
      averageAttentionMs: data.visits === 0 ? 0 : Math.round(data.sectionAttentionMs / data.visits),
    };
  };
}
