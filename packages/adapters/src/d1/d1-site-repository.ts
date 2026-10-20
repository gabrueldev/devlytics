import type { Site, SiteRepository } from "@devlytics/core";
import { schema, type Database } from "@devlytics/db";
import { eq } from "drizzle-orm";

export class D1SiteRepository implements SiteRepository {
  constructor(private readonly db: Database) {}

  async findByDomain(domain: string): Promise<Site | null> {
    const site = await this.db.select().from(schema.sites).where(eq(schema.sites.domain, domain)).get();

    return site ?? null;
  }
}
