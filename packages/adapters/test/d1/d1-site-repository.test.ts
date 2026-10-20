import { env } from "cloudflare:test";
import { createDatabase, schema } from "@devlytics/db";
import { beforeEach, describe, expect, it } from "vitest";
import { D1SiteRepository } from "../../src";

const db = createDatabase(env.DB);
const createdAt = new Date("2026-10-20T00:00:00Z");
const site = { id: "site_1", userId: "user_1", name: "Fulano", domain: "fulano.dev", createdAt };

describe("D1SiteRepository", () => {
  beforeEach(async () => {
    await db.delete(schema.sites);
    await db.delete(schema.users);
    await db
      .insert(schema.users)
      .values({ id: "user_1", githubId: "42", email: "fulano@dev.com", createdAt });
    await db.insert(schema.sites).values(site);
  });

  it("finds a site by its domain", async () => {
    await expect(new D1SiteRepository(db).findByDomain("fulano.dev")).resolves.toEqual(site);
  });

  it("returns null for a domain nobody registered", async () => {
    await expect(new D1SiteRepository(db).findByDomain("stranger.dev")).resolves.toBeNull();
  });

  it("lists a developer's sites in the order they were added", async () => {
    const sites = new D1SiteRepository(db);
    const later = {
      ...site,
      id: "site_2",
      domain: "blog.fulano.dev",
      createdAt: new Date("2026-10-21T00:00:00Z"),
    };
    await sites.add(later);

    await expect(sites.listByUser("user_1")).resolves.toEqual([site, later]);
  });

  it("removes a site", async () => {
    const sites = new D1SiteRepository(db);
    await sites.remove("site_1");

    await expect(sites.findById("site_1")).resolves.toBeNull();
  });
});
