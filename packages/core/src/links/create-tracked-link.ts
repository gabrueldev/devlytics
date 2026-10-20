import { ownedSite, type SiteCatalog } from "../sites";
import { InvalidLinkError, LinkTakenError } from "./errors";
import type { TrackedLinkRepository } from "./ports";
import { slugFrom } from "./slug";
import type { TrackedLink } from "./tracked-link";

const maxLabelLength = 120;

export function createTrackedLink(deps: {
  sites: SiteCatalog;
  links: TrackedLinkRepository;
  newId: () => string;
  now: () => Date;
}) {
  return async (
    userId: string,
    siteId: string,
    input: { label: string; slug?: string },
  ): Promise<TrackedLink> => {
    const site = await ownedSite(deps.sites, userId, siteId);
    const label = input.label.trim().slice(0, maxLabelLength);
    const slug = slugFrom(input.slug?.trim() || label);
    if (!label || !slug) throw new InvalidLinkError(input.label);
    if ((await deps.links.findBySlug(site.id, slug)) !== null) throw new LinkTakenError(slug);

    const link: TrackedLink = {
      id: deps.newId(),
      siteId: site.id,
      slug,
      label,
      firstOpenedAt: null,
      createdAt: deps.now(),
    };
    await deps.links.add(link);
    return link;
  };
}
