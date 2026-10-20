import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("GET /api/demo", () => {
  it("answers 404 while the demo portfolio is not registered", async () => {
    const response = await exports.default.fetch("https://devlytics.test/api/demo");

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "demo_site_not_registered" });
  });

  it("lets the product site read it from another origin", async () => {
    const response = await exports.default.fetch("https://devlytics.test/api/demo", {
      headers: { origin: "https://devlytics-web.gabrueldev.workers.dev" },
    });

    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });
});
