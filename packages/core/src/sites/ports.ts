import type { Site } from "./site";

export interface SiteRepository {
  findByDomain(domain: string): Promise<Site | null>;
}
