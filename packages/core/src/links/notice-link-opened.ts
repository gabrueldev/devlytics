import type { UserRepository } from "../accounts";
import type { SiteCatalog } from "../sites";
import { slugFrom } from "./slug";
import type { Mail, Mailer, TrackedLinkRepository } from "./ports";

export interface LinkOpenedMailText {
  subject: (label: string) => string;
  body: (label: string, domain: string, timelineUrl: string) => string;
}

export function noticeLinkOpened(deps: {
  links: TrackedLinkRepository;
  sites: SiteCatalog;
  users: UserRepository;
  mailer: Mailer;
  dashboardUrl: (siteId: string, linkId: string) => string;
  text: LinkOpenedMailText;
}) {
  return async (siteId: string, ref: string, at: Date): Promise<boolean> => {
    const slug = slugFrom(ref);
    if (!slug) return false;

    const link = await deps.links.markFirstOpened(siteId, slug, at);
    if (link === null) return false;

    const site = await deps.sites.findById(siteId);
    const owner = site === null ? null : await deps.users.findById(site.userId);
    if (site === null || owner === null) return true;

    await deps.mailer.send(
      mailFor(owner.email, link.label, site.domain, deps.dashboardUrl(site.id, link.id), deps.text),
    );
    return true;
  };
}

function mailFor(to: string, label: string, domain: string, url: string, text: LinkOpenedMailText): Mail {
  const body = text.body(label, domain, url);
  return {
    to,
    subject: text.subject(label),
    text: body,
    html: `<p>${escapeHtml(body).replace(escapeHtml(url), `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`)}</p>`,
  };
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
