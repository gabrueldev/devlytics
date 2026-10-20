import type { SiteCatalog } from "../sites";
import { funnelOf, type FunnelStep } from "../stats";
import { ownedLink } from "./owned-link";
import type { LinkVisitsReader, TrackedLinkRepository } from "./ports";
import type { LinkVisit, TrackedLink } from "./tracked-link";

const lookbackDays = 90;
const dayMs = 24 * 60 * 60 * 1000;

export function getLinkTimeline(deps: {
  sites: SiteCatalog;
  links: TrackedLinkRepository;
  visits: LinkVisitsReader;
  now: () => Date;
}) {
  return async (
    userId: string,
    siteId: string,
    linkId: string,
  ): Promise<{ link: TrackedLink; visits: LinkVisit[]; funnel: FunnelStep[] }> => {
    const { site, link } = await ownedLink(deps, userId, siteId, linkId);
    const until = deps.now();
    const since = new Date(
      Math.max(link.createdAt.getTime(), until.getTime() - lookbackDays * dayMs) - dayMs,
    );
    const visits = await deps.visits.visitsOf(site.id, link.slug, { since, until });
    const funnel = funnelOf(
      visits.map((visit) => ({
        attentionMs: visit.attentionMs,
        viewedProjects: visit.projects.length > 0,
        actions: visit.clicks.map((click) => click.action),
      })),
    );
    return { link, visits, funnel };
  };
}
