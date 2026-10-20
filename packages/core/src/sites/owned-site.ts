import { SiteNotFoundError } from "./errors";
import type { SiteCatalog } from "./ports";
import type { Site } from "./site";

export async function ownedSite(sites: SiteCatalog, userId: string, siteId: string): Promise<Site> {
  const site = await sites.findById(siteId);
  if (site === null || site.userId !== userId) throw new SiteNotFoundError(siteId);
  return site;
}
