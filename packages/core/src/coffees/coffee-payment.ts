export type CoffeePaymentEvent =
  { kind: "paid"; orderId: string; at: Date } | { kind: "reversed"; orderId: string; at: Date };
