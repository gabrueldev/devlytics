import { describe, expect, it } from "vitest";
import { chargeCardCoffee, type CardChargeRequest } from "../../src";
import { InMemoryCoffeeLedger } from "../fakes/in-memory-coffee-ledger";
import { ScriptedPaymentGateway } from "../fakes/scripted-payment-gateway";

const now = new Date("2026-10-20T15:00:00Z");

const request: CardChargeRequest = {
  payer: { name: "Ada Lovelace", email: "ada@example.com", phone: "5511999999999", cpf: "52998224725" },
  fingerprint: "browser-fingerprint",
  idempotencyKey: "0b8f7a8e-6f4e-4a8e-9f61-0d6cf4d0c9a1",
  cardToken: "card_token",
  antifraudReference: "antifraud_reference",
  threeDSecure: { eci: "05" },
  ip: "203.0.113.7",
};

describe("chargeCardCoffee", () => {
  it("counts the coffee as soon as the card is captured", async () => {
    const ledger = new InMemoryCoffeeLedger();
    const charge = chargeCardCoffee({
      gateway: new ScriptedPaymentGateway({ orderId: "order_1", outcome: "paid" }),
      ledger,
      now: () => now,
    });

    await charge(request);

    await expect(ledger.isPaid("order_1")).resolves.toBe(true);
  });

  it("leaves pending and declined cards to the webhook", async () => {
    const ledger = new InMemoryCoffeeLedger();
    const gateway = new ScriptedPaymentGateway({ orderId: "order_2", outcome: "pending" });

    await chargeCardCoffee({ gateway, ledger, now: () => now })(request);

    expect(gateway.cardRequests).toEqual([request]);
    await expect(ledger.isPaid("order_2")).resolves.toBe(false);
  });
});
