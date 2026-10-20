import type { SiteRepository } from "../sites";
import { UnknownSiteError } from "../sites";
import { overviewOf } from "./overview-of";
import type { SiteStatsReader } from "./ports";
import type { SiteOverview } from "./site-totals";

const demoPeriodDays = 7;
const dayMs = 24 * 60 * 60 * 1000;

export function getDemoOverview(deps: {
  sites: SiteRepository;
  stats: SiteStatsReader;
  demoDomain: string;
  now: () => Date;
}) {
  return async (): Promise<SiteOverview> => {
    const site = await deps.sites.findByDomain(deps.demoDomain);
    if (site === null) throw new UnknownSiteError(deps.demoDomain);

    const until = deps.now();
    const since = new Date(until.getTime() - demoPeriodDays * dayMs);

    return overviewOf(await deps.stats.totals(site.id, { since, until }));
  };
}
