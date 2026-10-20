import { ownedSite } from "./owned-site";
import type { SiteCatalog } from "./ports";

export function removeSite(deps: { sites: SiteCatalog }) {
  return async (userId: string, siteId: string): Promise<void> => {
    const site = await ownedSite(deps.sites, userId, siteId);
    await deps.sites.remove(site.id);
  };
}
