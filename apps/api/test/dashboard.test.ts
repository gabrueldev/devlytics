import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { SessionTokens } from "@devlytics/core";
import { createDatabase, schema } from "@devlytics/db";
import { beforeEach, describe, expect, it } from "vitest";

const appOrigin = "https://devlytics.gabrueldev.com";
const db = createDatabase(env.DB);
const createdAt = new Date("2026-10-20T00:00:00Z");

const cookieFor = async (userId: string) => {
  const token = await new SessionTokens("test-session-secret").issue({
    userId,
    expiresAt: new Date(Date.now() + 60_000),
  });
  return `dl_session=${token}`;
};

const call = async (path: string, init: RequestInit & { as?: string } = {}) => {
  const headers = new Headers(init.headers);
  if (init.as) headers.set("cookie", await cookieFor(init.as));
  return exports.default.fetch(`${appOrigin}/api${path}`, { ...init, headers, redirect: "manual" });
};

const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json", origin: appOrigin },
  body: JSON.stringify(body),
});

describe("dashboard", () => {
  beforeEach(async () => {
    await db.delete(schema.sites);
    await db.delete(schema.users);
    await db.insert(schema.users).values([
      { id: "user_1", githubId: "1", login: "fulano", email: "fulano@dev.com", name: "Fulano", createdAt },
      { id: "user_2", githubId: "2", login: "ciclano", email: "ciclano@dev.com", createdAt },
    ]);
    await db
      .insert(schema.sites)
      .values({ id: "site_2", userId: "user_2", name: "C", domain: "ciclano.dev", createdAt });
  });

  it("tells a visitor without a session to sign in", async () => {
    expect((await call("/me")).status).toBe(401);
  });

  it("refuses a session cookie signed with another secret", async () => {
    const token = await new SessionTokens("guess").issue({
      userId: "user_1",
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect((await call("/me", { headers: { cookie: `dl_session=${token}` } })).status).toBe(401);
  });

  it("registers a site and lists it for its owner only", async () => {
    const created = await call("/sites", {
      ...json({ name: "Fulano", domain: "https://fulano.dev/" }),
      as: "user_1",
    });
    expect(created.status).toBe(201);

    const me = (await (await call("/me", { as: "user_1" })).json()) as {
      user: { login: string };
      sites: unknown[];
    };
    expect(me.user.login).toBe("fulano");
    expect(me.sites).toEqual([expect.objectContaining({ name: "Fulano", domain: "fulano.dev" })]);
  });

  it("does not let a developer claim a domain someone already registered", async () => {
    const response = await call("/sites", { ...json({ domain: "ciclano.dev" }), as: "user_1" });

    expect(response.status).toBe(409);
  });

  it("refuses changes sent from another website", async () => {
    const response = await call("/sites", {
      ...json({ domain: "fulano.dev" }),
      headers: { "content-type": "application/json", origin: "https://evil.example" },
      as: "user_1",
    });

    expect(response.status).toBe(403);
  });

  it("hides other developers' sites and reports", async () => {
    const removal = await call("/sites/site_2", {
      method: "DELETE",
      headers: { origin: appOrigin },
      as: "user_1",
    });
    const report = await call("/sites/site_2/report?days=7", { as: "user_1" });

    expect(removal.status).toBe(404);
    expect(report.status).toBe(404);
  });

  it("sends the developer to GitHub with a state it can check on the way back", async () => {
    const response = await call("/auth/github?next=/en/dashboard");
    const location = new URL(response.headers.get("location") ?? "");

    expect(location.origin).toBe("https://github.com");
    expect(location.searchParams.get("redirect_uri")).toBe(`${appOrigin}/api/auth/github/callback`);
    expect(response.headers.get("set-cookie")).toContain(`dl_oauth=${location.searchParams.get("state")}`);
  });

  it("rejects a GitHub callback whose state does not match", async () => {
    const response = await call("/auth/github/callback?code=abc&state=forged", {
      headers: { cookie: "dl_oauth=expected%20%2Fpainel" },
    });

    expect(response.headers.get("location")).toBe("/painel?login=failed");
  });
});
