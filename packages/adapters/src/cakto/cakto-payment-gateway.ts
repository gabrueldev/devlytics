import {
  PaymentRejectedError,
  type BuyerContext,
  type CardCharge,
  type CardChargeRequest,
  type CardOutcome,
  type PaymentGateway,
  type PixCharge,
  type PixChargeRequest,
} from "@devlytics/core";
import type { CoffeePayer } from "@devlytics/shared";
import type { CaktoAccessTokens } from "./cakto-access-tokens";

const paymentsUrl = "https://api.cakto.com.br/public_api/payments/";
const pixLifetimeSeconds = 15 * 60;

interface CaktoOrder {
  id: string;
  status: string;
  pix?: { qrCode: string; expirationDate: string } | null;
}

export class CaktoPaymentGateway implements PaymentGateway {
  constructor(
    private readonly tokens: CaktoAccessTokens,
    private readonly offerId: string,
    private readonly send: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  async chargePix(request: PixChargeRequest): Promise<PixCharge> {
    const order = await this.createPayment(request.idempotencyKey, {
      paymentMethod: "pix",
      ...this.commonFields(request.payer, request.fingerprint, request),
      pixExpiresIn: pixLifetimeSeconds,
    });
    if (!order.pix) throw new PaymentRejectedError(502);

    return { orderId: order.id, code: order.pix.qrCode, expiresAt: new Date(order.pix.expirationDate) };
  }

  async chargeCard(request: CardChargeRequest): Promise<CardCharge> {
    const order = await this.createPayment(request.idempotencyKey, {
      paymentMethod: "threeDs",
      ...this.commonFields(request.payer, request.fingerprint, request),
      card: { token: request.cardToken },
      threeDSecure: request.threeDSecure,
      installments: 1,
      antifraud_profiling_attempt_reference: request.antifraudReference,
    });

    return { orderId: order.id, outcome: outcomeOf(order.status) };
  }

  private commonFields(payer: CoffeePayer, fingerprint: string, buyer: BuyerContext) {
    return {
      customer: {
        name: payer.name,
        email: payer.email,
        phone: payer.phone,
        fingerprint,
        ...(payer.cpf === undefined ? {} : { docType: "cpf", docNumber: payer.cpf }),
        ...(buyer.ip === null ? {} : { ip: buyer.ip }),
      },
      items: [{ offerId: this.offerId, quantity: 1 }],
    };
  }

  private async createPayment(idempotencyKey: string, body: object, retried = false): Promise<CaktoOrder> {
    const response = await this.send(paymentsUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${await this.tokens.current()}`,
        "content-type": "application/json",
        "x-idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401 && !retried) {
      this.tokens.forget();
      return this.createPayment(idempotencyKey, body, true);
    }
    if (!response.ok) throw new PaymentRejectedError(response.status);

    return (await response.json()) as CaktoOrder;
  }
}

function outcomeOf(status: string): CardOutcome {
  if (status === "paid") return "paid";
  if (status === "pending" || status === "waiting_payment") return "pending";
  return "declined";
}
