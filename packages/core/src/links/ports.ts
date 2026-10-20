import type { StatsPeriod } from "../stats";
import type { LinkVisit, TrackedLink } from "./tracked-link";

export interface TrackedLinkRepository {
  listBySite(siteId: string): Promise<TrackedLink[]>;
  findById(id: string): Promise<TrackedLink | null>;
  findBySlug(siteId: string, slug: string): Promise<TrackedLink | null>;
  add(link: TrackedLink): Promise<void>;
  remove(id: string): Promise<void>;
  markFirstOpened(siteId: string, slug: string, at: Date): Promise<TrackedLink | null>;
}

export interface LinkVisitsReader {
  visitsOf(siteId: string, slug: string, period: StatsPeriod): Promise<LinkVisit[]>;
}

export interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}
