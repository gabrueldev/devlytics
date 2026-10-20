import type { PixCharge, PixChargeRequest } from "./coffee-charge";
import type { PaymentGateway } from "./ports";

export function chargePixCoffee(deps: { gateway: PaymentGateway }) {
  return (request: PixChargeRequest): Promise<PixCharge> => deps.gateway.chargePix(request);
}
