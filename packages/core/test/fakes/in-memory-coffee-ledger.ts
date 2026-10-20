import type { CoffeeLedger } from "../../src";

interface Entry {
  paidAt: Date | null;
  reversedAt: Date | null;
}

export class InMemoryCoffeeLedger implements CoffeeLedger {
  readonly entries = new Map<string, Entry>();

  async recordPaid(orderId: string, at: Date): Promise<void> {
    const entry = this.entryOf(orderId);
    entry.paidAt ??= at;
  }

  async recordReversed(orderId: string, at: Date): Promise<void> {
    const entry = this.entryOf(orderId);
    entry.reversedAt ??= at;
  }

  async countKept(): Promise<number> {
    return [...this.entries.values()].filter((entry) => entry.paidAt !== null && entry.reversedAt === null)
      .length;
  }

  async isPaid(orderId: string): Promise<boolean> {
    const entry = this.entries.get(orderId);
    return entry !== undefined && entry.paidAt !== null && entry.reversedAt === null;
  }

  private entryOf(orderId: string): Entry {
    const entry = this.entries.get(orderId) ?? { paidAt: null, reversedAt: null };
    this.entries.set(orderId, entry);
    return entry;
  }
}
