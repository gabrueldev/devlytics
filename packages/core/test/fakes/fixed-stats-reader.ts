import type { SiteStatsReader, SiteTotals, StatsPeriod } from "../../src";

export class FixedStatsReader implements SiteStatsReader {
  readonly requests: { siteId: string; period: StatsPeriod }[] = [];

  constructor(private readonly fixedTotals: SiteTotals) {}

  async totals(siteId: string, period: StatsPeriod): Promise<SiteTotals> {
    this.requests.push({ siteId, period });
    return this.fixedTotals;
  }
}
