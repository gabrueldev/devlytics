import { describe, expect, it } from "vitest";
import { parseCaktoWebhook } from "../../src";

const receivedAt = new Date("2026-10-20T12:00:00Z");
const order = { id: "order_1", status: "paid", amount: 12.61, paidAt: "2026-10-20T11:59:00Z" };
const delivery = (event: string, data: unknown) => JSON.stringify({ secret: "s3cret", event, data });

describe("parseCaktoWebhook", () => {
  it("reads an approved purchase as a paid coffee", () => {
    expect(parseCaktoWebhook(delivery("purchase_approved", order), receivedAt)).toEqual({
      secret: "s3cret",
      payments: [{ kind: "paid", orderId: "order_1", at: new Date("2026-10-20T11:59:00Z") }],
    });
  });

  it("reads refunds and chargebacks as reversals", () => {
    expect(parseCaktoWebhook(delivery("refund", order), receivedAt)?.payments).toEqual([
      { kind: "reversed", orderId: "order_1", at: receivedAt },
    ]);
    expect(parseCaktoWebhook(delivery("chargeback", order), receivedAt)?.payments).toEqual([
      { kind: "reversed", orderId: "order_1", at: receivedAt },
    ]);
  });

  it("accepts the version 2 format that sends orders as a list", () => {
    const payments = parseCaktoWebhook(
      delivery("purchase_approved", [order, { ...order, id: "order_2" }]),
      receivedAt,
    )?.payments;

    expect(payments?.map((payment) => payment.orderId)).toEqual(["order_1", "order_2"]);
  });

  it("ignores events that do not change the count", () => {
    expect(parseCaktoWebhook(delivery("pix_gerado", order), receivedAt)?.payments).toEqual([]);
    expect(
      parseCaktoWebhook(delivery("checkout_abandonment", { customerEmail: "a@b.com" }), receivedAt),
    ).toBeNull();
  });

  it("rejects bodies that are not a Cakto delivery", () => {
    expect(parseCaktoWebhook("{not json", receivedAt)).toBeNull();
    expect(parseCaktoWebhook(JSON.stringify({ event: "purchase_approved" }), receivedAt)).toBeNull();
  });
});
