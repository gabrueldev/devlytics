export interface CoffeeLedger {
  recordPaid(orderId: string, at: Date): Promise<void>;
  recordReversed(orderId: string, at: Date): Promise<void>;
  countKept(): Promise<number>;
}
