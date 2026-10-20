import type { CardCharge, CardChargeRequest, PaymentGateway, PixCharge, PixChargeRequest } from "../../src";

export class ScriptedPaymentGateway implements PaymentGateway {
  readonly cardRequests: CardChargeRequest[] = [];

  constructor(private readonly cardCharge: CardCharge) {}

  async chargePix(request: PixChargeRequest): Promise<PixCharge> {
    return { orderId: request.idempotencyKey, code: "000201pix", expiresAt: new Date(0) };
  }

  async chargeCard(request: CardChargeRequest): Promise<CardCharge> {
    this.cardRequests.push(request);
    return this.cardCharge;
  }
}
