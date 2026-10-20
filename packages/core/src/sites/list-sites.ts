import type { SiteCatalog } from "./ports";
import type { Site } from "./site";

export function listSites(deps: { sites: SiteCatalog }) {
  return (userId: string): Promise<Site[]> => deps.sites.listByUser(userId);
}
