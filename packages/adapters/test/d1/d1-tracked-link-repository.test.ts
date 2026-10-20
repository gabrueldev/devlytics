import { env } from "cloudflare:test";
import { createDatabase, schema } from "@devlytics/db";
import { beforeEach, describe, expect, it } from "vitest";
import { D1TrackedLinkRepository } from "../../src";

const db = createDatabase(env.DB);
const createdAt = new Date("2026-10-20T00:00:00Z");
const openedAt = new Date("2026-10-21T09:30:00Z");
const link = {
  id: "link_1",
  siteId: "site_1",
  slug: "nubank",
  label: "Nubank",
  firstOpenedAt: null,
  createdAt,
};

describe("D1TrackedLinkRepository", () => {
  beforeEach(async () => {
    await db.delete(schema.trackedLinks);
    await db.delete(schema.sites);
    await db.delete(schema.users);
    await db.insert(schema.users).values({ id: "user_1", githubId: "1", email: "fulano@dev.com", createdAt });
    await db
      .insert(schema.sites)
      .values({ id: "site_1", userId: "user_1", name: "F", domain: "fulano.dev", createdAt });
    await new D1TrackedLinkRepository(db).add(link);
  });

  it("marks the first opening only once", async () => {
    const links = new D1TrackedLinkRepository(db);

    await expect(links.markFirstOpened("site_1", "nubank", openedAt)).resolves.toEqual({
      ...link,
      firstOpenedAt: openedAt,
    });
    await expect(links.markFirstOpened("site_1", "nubank", new Date())).resolves.toBeNull();
    await expect(links.findById("link_1")).resolves.toMatchObject({ firstOpenedAt: openedAt });
  });

  it("does not match a ref from another site", async () => {
    await expect(
      new D1TrackedLinkRepository(db).markFirstOpened("site_2", "nubank", openedAt),
    ).resolves.toBeNull();
  });

  it("refuses the same ref twice on one site", async () => {
    await expect(new D1TrackedLinkRepository(db).add({ ...link, id: "link_2" })).rejects.toThrow();
  });

  it("goes away with its site", async () => {
    await db.delete(schema.sites);

    await expect(new D1TrackedLinkRepository(db).findById("link_1")).resolves.toBeNull();
  });
});
