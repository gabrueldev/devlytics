import { env } from "cloudflare:test";
import { createDatabase, schema } from "@devlytics/db";
import { beforeAll, describe, expect, it } from "vitest";
import { D1SiteRepository } from "../../src";

const db = createDatabase(env.DB);
const createdAt = new Date("2026-10-20T00:00:00Z");

describe("D1SiteRepository", () => {
  beforeAll(async () => {
    await db
      .insert(schema.users)
      .values({ id: "user_1", githubId: "42", email: "fulano@dev.com", createdAt });
    await db
      .insert(schema.sites)
      .values({ id: "site_1", userId: "user_1", name: "Fulano", domain: "fulano.dev", createdAt });
  });

  it("finds a site by its domain", async () => {
    const site = await new D1SiteRepository(db).findByDomain("fulano.dev");

    expect(site).toEqual({ id: "site_1", userId: "user_1", name: "Fulano", domain: "fulano.dev", createdAt });
  });

  it("returns null for a domain nobody registered", async () => {
    await expect(new D1SiteRepository(db).findByDomain("stranger.dev")).resolves.toBeNull();
  });
});
