import { PaymentRejectedError } from "@devlytics/core";
import { describe, expect, it } from "vitest";
import { CaktoAccessTokens, CaktoPaymentGateway, type CachedToken, type TokenCache } from "../../src";

interface SentRequest {
  url: string;
  headers: Headers;
  body: string;
}

const payer = { name: "Ada Lovelace", email: "ada@example.com", phone: "5511999999999", cpf: "52998224725" };
const pixRequest = {
  payer,
  fingerprint: "browser-fingerprint",
  idempotencyKey: "0b8f7a8e-6f4e-4a8e-9f61-0d6cf4d0c9a1",
  ip: "203.0.113.7",
};

function fakeCakto(paymentResponses: Response[]) {
  const sent: SentRequest[] = [];
  let issued = 0;
  const send: typeof fetch = async (input, init) => {
    const url = String(input);
    sent.push({ url, headers: new Headers(init?.headers), body: String(init?.body) });
    if (url.endsWith("/token/")) {
      issued++;
      return Response.json({ access_token: `token_${issued}`, expires_in: 36000, token_type: "Bearer" });
    }
    return paymentResponses.shift() ?? new Response(null, { status: 500 });
  };
  return { sent, send };
}

function gatewayWith(send: typeof fetch) {
  const tokens = new CaktoAccessTokens({ clientId: crypto.randomUUID(), clientSecret: "secret" }, send);
  return new CaktoPaymentGateway(tokens, "offer_1", send);
}

const pixOrder = {
  id: "order_1",
  status: "waiting_payment",
  pix: { qrCode: "000201pix", expirationDate: "2026-10-20T15:15:00-03:00" },
};

describe("CaktoPaymentGateway", () => {
  it("creates a Pix charge for the coffee offer and returns the copy-and-paste code", async () => {
    const { sent, send } = fakeCakto([Response.json(pixOrder, { status: 201 })]);

    const charge = await gatewayWith(send).chargePix(pixRequest);

    expect(charge).toEqual({
      orderId: "order_1",
      code: "000201pix",
      expiresAt: new Date("2026-10-20T18:15:00Z"),
    });
    const [, payment] = sent;
    expect(payment?.headers.get("authorization")).toBe("Bearer token_1");
    expect(payment?.headers.get("x-idempotency-key")).toBe(pixRequest.idempotencyKey);
    expect(JSON.parse(payment?.body ?? "{}")).toMatchObject({
      paymentMethod: "pix",
      customer: { docType: "cpf", docNumber: "52998224725", ip: "203.0.113.7" },
      items: [{ offerId: "offer_1", quantity: 1 }],
    });
  });

  it("reuses the access token between charges", async () => {
    const { sent, send } = fakeCakto([
      Response.json(pixOrder, { status: 201 }),
      Response.json(pixOrder, { status: 201 }),
    ]);
    const gateway = gatewayWith(send);

    await gateway.chargePix(pixRequest);
    await gateway.chargePix(pixRequest);

    expect(sent.filter((request) => request.url.endsWith("/token/"))).toHaveLength(1);
  });

  it("asks for a new token once when Cakto says the current one expired", async () => {
    const { sent, send } = fakeCakto([
      new Response(null, { status: 401 }),
      Response.json(pixOrder, { status: 201 }),
    ]);

    await gatewayWith(send).chargePix(pixRequest);

    expect(sent.at(-1)?.headers.get("authorization")).toBe("Bearer token_2");
  });

  it("sends the card as a 3DS charge with the antifraud reference in snake case", async () => {
    const { sent, send } = fakeCakto([Response.json({ id: "order_2", status: "paid" }, { status: 201 })]);

    const charge = await gatewayWith(send).chargeCard({
      ...pixRequest,
      payer: { ...payer, cpf: undefined },
      cardToken: "card_token",
      antifraudReference: "antifraud_reference",
      threeDSecure: { eci: "05", referenceId: "cakto-3ds-1" },
    });

    expect(charge).toEqual({ orderId: "order_2", outcome: "paid" });
    const body = JSON.parse(sent[1]?.body ?? "{}");
    expect(body).toMatchObject({
      paymentMethod: "threeDs",
      card: { token: "card_token" },
      antifraud_profiling_attempt_reference: "antifraud_reference",
    });
    expect(body.customer).not.toHaveProperty("docNumber");
  });

  it("reports a refused charge with the provider status", async () => {
    const { send } = fakeCakto([new Response(null, { status: 400 })]);

    await expect(gatewayWith(send).chargePix(pixRequest)).rejects.toMatchObject({ status: 400 });
  });

  it("takes the token another instance already issued instead of asking Cakto again", async () => {
    const clientId = crypto.randomUUID();
    const shared = new Map<string, CachedToken>();
    const cache: TokenCache = {
      read: async (key) => shared.get(key) ?? null,
      write: async (key, token) => void shared.set(key, token),
      remove: async (key) => void shared.delete(key),
    };
    shared.set(clientId, { value: "token_from_peer", expiresAt: Date.now() + 3_600_000 });
    const { sent, send } = fakeCakto([Response.json(pixOrder, { status: 201 })]);

    const tokens = new CaktoAccessTokens({ clientId, clientSecret: "secret" }, send, Date.now, cache);
    await new CaktoPaymentGateway(tokens, "offer_1", send).chargePix(pixRequest);

    expect(sent.map((request) => request.headers.get("authorization"))).toEqual(["Bearer token_from_peer"]);
  });
});
