import { env } from "cloudflare:test";
import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const chrome =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

const batch = { url: "https://fulano.dev/", events: [{ type: "pageview" }] };

const collect = (body: string, headers: Record<string, string> = {}) =>
  exports.default.fetch("https://devlytics.test/e", {
    method: "POST",
    headers: {
      "content-type": "text/plain;charset=UTF-8",
      origin: "https://fulano.dev",
      "user-agent": chrome,
      ...headers,
    },
    body,
  });

describe("POST /e", () => {
  it("accepts a batch from a registered portfolio", async () => {
    const response = await collect(JSON.stringify(batch));

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("refuses portfolios nobody registered", async () => {
    const response = await collect(JSON.stringify({ ...batch, url: "https://stranger.dev/" }), {
      origin: "https://stranger.dev",
    });

    expect(response.status).toBe(403);
  });

  it("rejects payloads that break the contract", async () => {
    expect((await collect("{not json")).status).toBe(400);
    expect((await collect(JSON.stringify({ ...batch, events: [] }))).status).toBe(400);
  });

  it("rejects oversized bodies", async () => {
    expect((await collect("x".repeat(65 * 1024))).status).toBe(413);
  });

  it("answers bots without recording them", async () => {
    const response = await collect(JSON.stringify(batch), { "user-agent": "Googlebot/2.1" });

    expect(response.status).toBe(204);
  });
});

describe("tracked links", () => {
  it("marks a registered ref as opened on its first visit", async () => {
    const site = await env.DB.prepare("SELECT id FROM sites WHERE domain = 'fulano.dev'").first<{
      id: string;
    }>();
    await env.DB.prepare(
      "INSERT INTO tracked_links (id, site_id, slug, label, created_at) VALUES ('link_1', ?, 'nubank', 'Nubank', 0)",
    )
      .bind(site?.id)
      .run();

    expect((await collect(JSON.stringify({ ...batch, ref: "nubank" }))).status).toBe(204);

    await expect
      .poll(async () => {
        const link = await env.DB.prepare(
          "SELECT first_opened_at FROM tracked_links WHERE id = 'link_1'",
        ).first<{
          first_opened_at: number | null;
        }>();
        return link?.first_opened_at ?? null;
      })
      .not.toBeNull();
  });
});
