import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const post = (path: string, body: unknown, ip = crypto.randomUUID()) =>
  exports.default.fetch(`https://devlytics.test/api${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify(body),
  });

const approve = (orderId: string) =>
  exports.default.fetch("https://devlytics.test/api/webhooks/cakto", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret: "test-secret", event: "purchase_approved", data: { id: orderId } }),
  });

const statusOf = async (orderId: string) => {
  const response = await exports.default.fetch(`https://devlytics.test/api/coffees/orders/${orderId}`);
  return (await response.json()) as { paid: boolean };
};

describe("coffee checkout", () => {
  it("refuses a Pix request without the payer details Cakto requires", async () => {
    const response = await post("/coffees/pix", {
      payer: { name: "Ada" },
      idempotencyKey: crypto.randomUUID(),
    });

    expect(response.status).toBe(400);
  });

  it("refuses a card request without the antifraud reference", async () => {
    const response = await post("/coffees/card", {
      payer: { name: "Ada Lovelace", email: "ada@example.com", phone: "11999999999", cpf: "52998224725" },
      fingerprint: "browser-fingerprint",
      idempotencyKey: crypto.randomUUID(),
      cardToken: "card_token",
      threeDSecure: {},
    });

    expect(response.status).toBe(400);
  });

  it("slows down a visitor who keeps starting checkouts", async () => {
    const ip = "198.51.100.9";
    const statuses = [];
    for (let attempt = 0; attempt < 6; attempt++) statuses.push((await post("/coffees/pix", {}, ip)).status);

    expect(statuses.at(-1)).toBe(429);
  });

  it("reports an order as paid once the webhook confirms it", async () => {
    expect(await statusOf("order_waiting")).toEqual({ paid: false });

    await approve("order_waiting");

    expect(await statusOf("order_waiting")).toEqual({ paid: true });
  });

  it("does not look up order ids that Cakto could never have issued", async () => {
    const response = await exports.default.fetch("https://devlytics.test/api/coffees/orders/..%2Fetc");

    expect(response.status).toBe(404);
  });

  it("lets the product site on its workers.dev address start a checkout", async () => {
    const response = await exports.default.fetch("https://devlytics.test/api/coffees/pix", {
      method: "OPTIONS",
      headers: {
        origin: "https://devlytics-web.gabrueldev.workers.dev",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(
      "https://devlytics-web.gabrueldev.workers.dev",
    );
  });

  it("does not let other sites start a checkout from the browser", async () => {
    const response = await exports.default.fetch("https://devlytics.test/api/coffees/pix", {
      method: "OPTIONS",
      headers: { origin: "https://evil.example", "access-control-request-method": "POST" },
    });

    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
