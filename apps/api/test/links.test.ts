import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { SessionTokens } from "@devlytics/core";
import { createDatabase, schema } from "@devlytics/db";
import { beforeEach, describe, expect, it } from "vitest";

const appOrigin = "https://devlytics.gabrueldev.com";
const db = createDatabase(env.DB);
const createdAt = new Date("2026-10-20T00:00:00Z");

const call = async (path: string, as: string, init: RequestInit = {}) => {
  const token = await new SessionTokens("test-session-secret").issue({
    userId: as,
    expiresAt: new Date(Date.now() + 60_000),
  });
  const headers = new Headers(init.headers);
  headers.set("cookie", `dl_session=${token}`);
  headers.set("origin", appOrigin);
  if (init.body) headers.set("content-type", "application/json");
  return exports.default.fetch(`${appOrigin}/api${path}`, { ...init, headers });
};

describe("tracked links", () => {
  beforeEach(async () => {
    await db.delete(schema.trackedLinks);
    await db.delete(schema.sites);
    await db.delete(schema.users);
    await db.insert(schema.users).values([
      { id: "user_1", githubId: "1", email: "fulano@dev.com", createdAt },
      { id: "user_2", githubId: "2", email: "ciclano@dev.com", createdAt },
    ]);
    await db
      .insert(schema.sites)
      .values({ id: "site_1", userId: "user_1", name: "F", domain: "fulano.dev", createdAt });
  });

  it("creates a link named after the job and lists it", async () => {
    const created = await call("/sites/site_1/links", "user_1", {
      method: "POST",
      body: JSON.stringify({ label: "Nubank — Front-end Pleno" }),
    });
    expect(created.status).toBe(201);

    const links = (await (await call("/sites/site_1/links", "user_1")).json()) as { slug: string }[];
    expect(links).toEqual([expect.objectContaining({ slug: "nubank-front-end-pleno", firstOpenedAt: null })]);
  });

  it("refuses the same ref twice", async () => {
    const create = () =>
      call("/sites/site_1/links", "user_1", { method: "POST", body: JSON.stringify({ label: "Nubank" }) });

    await create();
    expect((await create()).status).toBe(409);
  });

  it("keeps links private to the site owner", async () => {
    expect((await call("/sites/site_1/links", "user_2")).status).toBe(404);
    expect(
      (await call("/sites/site_1/links", "user_2", { method: "POST", body: JSON.stringify({ label: "x" }) }))
        .status,
    ).toBe(404);
  });

  it("removes a link", async () => {
    const created = (await (
      await call("/sites/site_1/links", "user_1", { method: "POST", body: JSON.stringify({ label: "Itaú" }) })
    ).json()) as { id: string };

    expect((await call(`/sites/site_1/links/${created.id}`, "user_1", { method: "DELETE" })).status).toBe(
      204,
    );
    expect(await (await call("/sites/site_1/links", "user_1")).json()).toEqual([]);
  });
});
