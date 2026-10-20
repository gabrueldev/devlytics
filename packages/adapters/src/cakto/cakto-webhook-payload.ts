import type { CoffeePaymentEvent } from "@devlytics/core";
import { z } from "zod";

const orderSchema = z.object({
  id: z.string().min(1),
  paidAt: z.string().nullish(),
});

const payloadSchema = z.object({
  secret: z.string(),
  event: z.string(),
  data: z.union([orderSchema, z.array(orderSchema)]),
});

const reversingEvents = new Set(["refund", "chargeback"]);

export interface CaktoWebhook {
  secret: string;
  payments: CoffeePaymentEvent[];
}

export function parseCaktoWebhook(body: string, receivedAt: Date): CaktoWebhook | null {
  const parsed = payloadSchema.safeParse(jsonOf(body));
  if (!parsed.success) return null;

  const { secret, event, data } = parsed.data;
  const orders = Array.isArray(data) ? data : [data];

  return { secret, payments: orders.flatMap((order) => paymentsOf(event, order, receivedAt)) };
}

function paymentsOf(
  event: string,
  order: z.infer<typeof orderSchema>,
  receivedAt: Date,
): CoffeePaymentEvent[] {
  if (event === "purchase_approved")
    return [{ kind: "paid", orderId: order.id, at: dateOr(order.paidAt, receivedAt) }];
  if (reversingEvents.has(event)) return [{ kind: "reversed", orderId: order.id, at: receivedAt }];
  return [];
}

function dateOr(value: string | null | undefined, fallback: Date): Date {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function jsonOf(body: string): unknown {
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}
