import type { Site } from "./site";

export interface SiteRepository {
  findByDomain(domain: string): Promise<Site | null>;
}

export interface SiteCatalog extends SiteRepository {
  findById(id: string): Promise<Site | null>;
  listByUser(userId: string): Promise<Site[]>;
  add(site: Site): Promise<void>;
  remove(id: string): Promise<void>;
}
