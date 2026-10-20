import type { Site, SiteRepository } from "../../src";

export class InMemorySiteRepository implements SiteRepository {
  constructor(private readonly sites: Site[] = []) {}

  async findByDomain(domain: string): Promise<Site | null> {
    return this.sites.find((site) => site.domain === domain) ?? null;
  }
}
