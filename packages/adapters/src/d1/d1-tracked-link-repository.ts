import type { TrackedLink, TrackedLinkRepository } from "@devlytics/core";
import { schema, type Database } from "@devlytics/db";
import { and, desc, eq, isNull } from "drizzle-orm";

const { trackedLinks } = schema;

export class D1TrackedLinkRepository implements TrackedLinkRepository {
  constructor(private readonly db: Database) {}

  async listBySite(siteId: string): Promise<TrackedLink[]> {
    return this.db
      .select()
      .from(trackedLinks)
      .where(eq(trackedLinks.siteId, siteId))
      .orderBy(desc(trackedLinks.createdAt));
  }

  async findById(id: string): Promise<TrackedLink | null> {
    return (await this.db.select().from(trackedLinks).where(eq(trackedLinks.id, id)).get()) ?? null;
  }

  async findBySlug(siteId: string, slug: string): Promise<TrackedLink | null> {
    return (
      (await this.db
        .select()
        .from(trackedLinks)
        .where(and(eq(trackedLinks.siteId, siteId), eq(trackedLinks.slug, slug)))
        .get()) ?? null
    );
  }

  async add(link: TrackedLink): Promise<void> {
    await this.db.insert(trackedLinks).values(link);
  }

  async remove(id: string): Promise<void> {
    await this.db.delete(trackedLinks).where(eq(trackedLinks.id, id));
  }

  async markFirstOpened(siteId: string, slug: string, at: Date): Promise<TrackedLink | null> {
    const [link] = await this.db
      .update(trackedLinks)
      .set({ firstOpenedAt: at })
      .where(
        and(eq(trackedLinks.siteId, siteId), eq(trackedLinks.slug, slug), isNull(trackedLinks.firstOpenedAt)),
      )
      .returning();
    return link ?? null;
  }
}
