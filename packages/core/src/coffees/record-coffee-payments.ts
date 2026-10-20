import type { CoffeePaymentEvent } from "./coffee-payment";
import type { CoffeeLedger } from "./ports";

export function recordCoffeePayments(deps: { ledger: CoffeeLedger }) {
  return async (events: CoffeePaymentEvent[]): Promise<void> => {
    for (const event of events) {
      if (event.kind === "paid") await deps.ledger.recordPaid(event.orderId, event.at);
      else await deps.ledger.recordReversed(event.orderId, event.at);
    }
  };
}
