import type { CardCoffeeRequest, PixCoffeeRequest } from "@devlytics/shared";

export interface BuyerContext {
  ip: string | null;
}

export type PixChargeRequest = PixCoffeeRequest & BuyerContext;
export type CardChargeRequest = CardCoffeeRequest & BuyerContext;

export interface PixCharge {
  orderId: string;
  code: string;
  expiresAt: Date;
}

export type CardOutcome = "paid" | "pending" | "declined";

export interface CardCharge {
  orderId: string;
  outcome: CardOutcome;
}

export class PaymentRejectedError extends Error {
  constructor(readonly status: number) {
    super(`Payment provider rejected the charge with status ${status}`);
    this.name = "PaymentRejectedError";
  }
}
