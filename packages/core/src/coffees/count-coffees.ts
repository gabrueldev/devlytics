import type { CoffeeLedger } from "./ports";

export function countCoffees(deps: { ledger: CoffeeLedger }) {
  return (): Promise<number> => deps.ledger.countKept();
}
