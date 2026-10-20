import { describe, expect, it } from "vitest";
import { countCoffees, recordCoffeePayments } from "../../src";
import { InMemoryCoffeeLedger } from "../fakes/in-memory-coffee-ledger";

const at = new Date("2026-10-20T12:00:00Z");

const setUp = () => {
  const ledger = new InMemoryCoffeeLedger();
  return { record: recordCoffeePayments({ ledger }), count: countCoffees({ ledger }) };
};

describe("recordCoffeePayments", () => {
  it("counts every paid order once", async () => {
    const { record, count } = setUp();

    await record([
      { kind: "paid", orderId: "order_1", at },
      { kind: "paid", orderId: "order_2", at },
    ]);

    await expect(count()).resolves.toBe(2);
  });

  it("ignores the same order delivered twice", async () => {
    const { record, count } = setUp();

    await record([{ kind: "paid", orderId: "order_1", at }]);
    await record([{ kind: "paid", orderId: "order_1", at }]);

    await expect(count()).resolves.toBe(1);
  });

  it("stops counting refunded or charged back orders", async () => {
    const { record, count } = setUp();

    await record([
      { kind: "paid", orderId: "order_1", at },
      { kind: "paid", orderId: "order_2", at },
      { kind: "reversed", orderId: "order_1", at },
    ]);

    await expect(count()).resolves.toBe(1);
  });

  it("keeps a reversal that arrives before its payment", async () => {
    const { record, count } = setUp();

    await record([
      { kind: "reversed", orderId: "order_1", at },
      { kind: "paid", orderId: "order_1", at },
    ]);

    await expect(count()).resolves.toBe(0);
  });
});
