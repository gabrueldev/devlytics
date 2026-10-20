import { ownedSite, type SiteCatalog } from "../sites";
import type { TrackedLinkRepository } from "./ports";
import type { TrackedLink } from "./tracked-link";

export function listTrackedLinks(deps: { sites: SiteCatalog; links: TrackedLinkRepository }) {
  return async (userId: string, siteId: string): Promise<TrackedLink[]> => {
    const site = await ownedSite(deps.sites, userId, siteId);
    return deps.links.listBySite(site.id);
  };
}
