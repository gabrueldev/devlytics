import type { Site, SiteCatalog } from "@devlytics/core";
import { schema, type Database } from "@devlytics/db";
import { asc, eq } from "drizzle-orm";

const { sites } = schema;

export class D1SiteRepository implements SiteCatalog {
  constructor(private readonly db: Database) {}

  async findByDomain(domain: string): Promise<Site | null> {
    return (await this.db.select().from(sites).where(eq(sites.domain, domain)).get()) ?? null;
  }

  async findById(id: string): Promise<Site | null> {
    return (await this.db.select().from(sites).where(eq(sites.id, id)).get()) ?? null;
  }

  async listByUser(userId: string): Promise<Site[]> {
    return this.db.select().from(sites).where(eq(sites.userId, userId)).orderBy(asc(sites.createdAt));
  }

  async add(site: Site): Promise<void> {
    await this.db.insert(sites).values(site);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(sites).where(eq(sites.id, id));
  }
}
