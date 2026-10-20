import type { CardCharge, CardChargeRequest } from "./coffee-charge";
import type { CoffeeLedger, PaymentGateway } from "./ports";

export function chargeCardCoffee(deps: { gateway: PaymentGateway; ledger: CoffeeLedger; now: () => Date }) {
  return async (request: CardChargeRequest): Promise<CardCharge> => {
    const charge = await deps.gateway.chargeCard(request);
    if (charge.outcome === "paid") await deps.ledger.recordPaid(charge.orderId, deps.now());
    return charge;
  };
}
