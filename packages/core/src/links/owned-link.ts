import { ownedSite, type Site, type SiteCatalog } from "../sites";
import { LinkNotFoundError } from "./errors";
import type { TrackedLinkRepository } from "./ports";
import type { TrackedLink } from "./tracked-link";

export async function ownedLink(
  deps: { sites: SiteCatalog; links: TrackedLinkRepository },
  userId: string,
  siteId: string,
  linkId: string,
): Promise<{ site: Site; link: TrackedLink }> {
  const site = await ownedSite(deps.sites, userId, siteId);
  const link = await deps.links.findById(linkId);
  if (link === null || link.siteId !== site.id) throw new LinkNotFoundError(linkId);
  return { site, link };
}
