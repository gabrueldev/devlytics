import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const order = { id: "order_1", status: "paid", amount: 12.61, paidAt: "2026-10-20T11:59:00Z" };

const deliver = (event: string, secret = "test-secret") =>
  exports.default.fetch("https://devlytics.test/api/webhooks/cakto", {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "CaktoBot/1.0" },
    body: JSON.stringify({ secret, event, data: { ...order } }),
  });

const coffeeCount = async () => {
  const response = await exports.default.fetch(
    `https://devlytics.test/api/coffees?at=${crypto.randomUUID()}`,
  );
  return ((await response.json()) as { count: number }).count;
};

describe("coffee payments", () => {
  it("counts a coffee once Cakto approves the purchase", async () => {
    expect((await deliver("purchase_approved")).status).toBe(200);
    expect((await deliver("purchase_approved")).status).toBe(200);

    expect(await coffeeCount()).toBe(1);
  });

  it("takes the coffee back on a refund", async () => {
    await deliver("purchase_approved");
    expect((await deliver("refund")).status).toBe(200);

    expect(await coffeeCount()).toBe(0);
  });

  it("refuses deliveries that do not carry the shared secret", async () => {
    expect((await deliver("purchase_approved", "guess")).status).toBe(401);

    expect(await coffeeCount()).toBe(0);
  });

  it("rejects bodies that are not Cakto deliveries", async () => {
    const response = await exports.default.fetch("https://devlytics.test/api/webhooks/cakto", {
      method: "POST",
      body: "{not json",
    });

    expect(response.status).toBe(400);
  });

  it("lets the product site read the count from another origin", async () => {
    const response = await exports.default.fetch("https://devlytics.test/api/coffees", {
      headers: { origin: "https://devlytics-web.gabrueldev.workers.dev" },
    });

    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("cache-control")).toBe("public, max-age=60");
  });
});
