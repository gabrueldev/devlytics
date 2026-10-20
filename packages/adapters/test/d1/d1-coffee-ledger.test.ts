import { env } from "cloudflare:test";
import { createDatabase, schema } from "@devlytics/db";
import { beforeEach, describe, expect, it } from "vitest";
import { D1CoffeeLedger } from "../../src";

const db = createDatabase(env.DB);
const firstAt = new Date("2026-10-20T12:00:00Z");
const laterAt = new Date("2026-10-21T12:00:00Z");

describe("D1CoffeeLedger", () => {
  beforeEach(async () => {
    await db.delete(schema.coffees);
  });

  it("counts paid orders that were not reversed", async () => {
    const ledger = new D1CoffeeLedger(db);

    await ledger.recordPaid("order_1", firstAt);
    await ledger.recordPaid("order_2", firstAt);
    await ledger.recordReversed("order_2", laterAt);

    await expect(ledger.countKept()).resolves.toBe(1);
  });

  it("keeps the first payment date when a delivery repeats", async () => {
    const ledger = new D1CoffeeLedger(db);

    await ledger.recordPaid("order_1", firstAt);
    await ledger.recordPaid("order_1", laterAt);

    const rows = await db.select().from(schema.coffees);
    expect(rows).toEqual([{ orderId: "order_1", paidAt: firstAt, reversedAt: null }]);
  });

  it("remembers a reversal that arrives before the payment", async () => {
    const ledger = new D1CoffeeLedger(db);

    await ledger.recordReversed("order_1", firstAt);
    await ledger.recordPaid("order_1", laterAt);

    await expect(ledger.countKept()).resolves.toBe(0);
  });

  it("tells a paid order apart from one that is waiting or was refunded", async () => {
    const ledger = new D1CoffeeLedger(db);

    await ledger.recordPaid("order_1", firstAt);
    await ledger.recordPaid("order_2", firstAt);
    await ledger.recordReversed("order_2", laterAt);

    await expect(ledger.isPaid("order_1")).resolves.toBe(true);
    await expect(ledger.isPaid("order_2")).resolves.toBe(false);
    await expect(ledger.isPaid("order_3")).resolves.toBe(false);
  });
});
