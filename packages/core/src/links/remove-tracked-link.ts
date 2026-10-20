import type { SiteCatalog } from "../sites";
import { ownedLink } from "./owned-link";
import type { TrackedLinkRepository } from "./ports";

export function removeTrackedLink(deps: { sites: SiteCatalog; links: TrackedLinkRepository }) {
  return async (userId: string, siteId: string, linkId: string): Promise<void> => {
    const { link } = await ownedLink(deps, userId, siteId, linkId);
    await deps.links.remove(link.id);
  };
}
