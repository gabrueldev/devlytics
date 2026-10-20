import type { Site, SiteCatalog } from "../../src";

export class InMemorySiteCatalog implements SiteCatalog {
  constructor(readonly sites: Site[] = []) {}

  async findByDomain(domain: string): Promise<Site | null> {
    return this.sites.find((site) => site.domain === domain) ?? null;
  }

  async findById(id: string): Promise<Site | null> {
    return this.sites.find((site) => site.id === id) ?? null;
  }

  async listByUser(userId: string): Promise<Site[]> {
    return this.sites.filter((site) => site.userId === userId);
  }

  async add(site: Site): Promise<void> {
    this.sites.push(site);
  }

  async remove(id: string): Promise<void> {
    const index = this.sites.findIndex((site) => site.id === id);
    if (index >= 0) this.sites.splice(index, 1);
  }
}
