import type { CardCharge, CardChargeRequest, PixCharge, PixChargeRequest } from "./coffee-charge";

export interface CoffeeLedger {
  recordPaid(orderId: string, at: Date): Promise<void>;
  recordReversed(orderId: string, at: Date): Promise<void>;
  countKept(): Promise<number>;
  isPaid(orderId: string): Promise<boolean>;
}

export interface PaymentGateway {
  chargePix(request: PixChargeRequest): Promise<PixCharge>;
  chargeCard(request: CardChargeRequest): Promise<CardCharge>;
}
