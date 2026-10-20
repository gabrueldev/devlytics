import type { CoffeeLedger } from "./ports";

export function isCoffeePaid(deps: { ledger: CoffeeLedger }) {
  return (orderId: string): Promise<boolean> => deps.ledger.isPaid(orderId);
}
