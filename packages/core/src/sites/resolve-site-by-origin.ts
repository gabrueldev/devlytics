import { domainFromOrigin } from "./domain";
import { InvalidOriginError, UnknownSiteError } from "./errors";
import type { SiteRepository } from "./ports";
import type { Site } from "./site";

export function resolveSiteByOrigin(deps: { sites: SiteRepository }) {
  return async (origin: string | null): Promise<Site> => {
    const domain = origin === null ? null : domainFromOrigin(origin);
    if (domain === null) throw new InvalidOriginError(origin);

    const site = await deps.sites.findByDomain(domain);
    if (site === null) throw new UnknownSiteError(domain);

    return site;
  };
}
