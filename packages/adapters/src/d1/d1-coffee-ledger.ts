import type { CoffeeLedger } from "@devlytics/core";
import { schema, type Database } from "@devlytics/db";
import { and, count, eq, isNotNull, isNull, sql } from "drizzle-orm";

const { coffees } = schema;

export class D1CoffeeLedger implements CoffeeLedger {
  constructor(private readonly db: Database) {}

  async recordPaid(orderId: string, at: Date): Promise<void> {
    await this.db
      .insert(coffees)
      .values({ orderId, paidAt: at })
      .onConflictDoUpdate({
        target: coffees.orderId,
        set: { paidAt: sql`coalesce(${coffees.paidAt}, excluded.paid_at)` },
      });
  }

  async recordReversed(orderId: string, at: Date): Promise<void> {
    await this.db
      .insert(coffees)
      .values({ orderId, reversedAt: at })
      .onConflictDoUpdate({
        target: coffees.orderId,
        set: { reversedAt: sql`coalesce(${coffees.reversedAt}, excluded.reversed_at)` },
      });
  }

  async countKept(): Promise<number> {
    const row = await this.db
      .select({ total: count() })
      .from(coffees)
      .where(and(isNotNull(coffees.paidAt), isNull(coffees.reversedAt)))
      .get();

    return row?.total ?? 0;
  }

  async isPaid(orderId: string): Promise<boolean> {
    const row = await this.db
      .select({ orderId: coffees.orderId })
      .from(coffees)
      .where(and(eq(coffees.orderId, orderId), isNotNull(coffees.paidAt), isNull(coffees.reversedAt)))
      .get();

    return row !== undefined;
  }
}
