import type { TrackedLink, TrackedLinkRepository } from "../../src";

export class InMemoryTrackedLinks implements TrackedLinkRepository {
  constructor(readonly links: TrackedLink[] = []) {}

  async listBySite(siteId: string): Promise<TrackedLink[]> {
    return this.links.filter((link) => link.siteId === siteId);
  }

  async findById(id: string): Promise<TrackedLink | null> {
    return this.links.find((link) => link.id === id) ?? null;
  }

  async findBySlug(siteId: string, slug: string): Promise<TrackedLink | null> {
    return this.links.find((link) => link.siteId === siteId && link.slug === slug) ?? null;
  }

  async add(link: TrackedLink): Promise<void> {
    this.links.push(link);
  }

  async remove(id: string): Promise<void> {
    const index = this.links.findIndex((link) => link.id === id);
    if (index >= 0) this.links.splice(index, 1);
  }

  async markFirstOpened(siteId: string, slug: string, at: Date): Promise<TrackedLink | null> {
    const link = await this.findBySlug(siteId, slug);
    if (link === null || link.firstOpenedAt !== null) return null;
    link.firstOpenedAt = at;
    return link;
  }
}
