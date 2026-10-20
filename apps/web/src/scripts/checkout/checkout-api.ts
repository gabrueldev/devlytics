export type CheckoutFailure = "invalid" | "rejected" | "busy" | "unavailable";

export interface PixCharge {
  orderId: string;
  code: string;
  expiresAt: string;
}

export interface CardCharge {
  orderId: string;
  outcome: "paid" | "pending" | "declined";
}

export class CheckoutError extends Error {
  constructor(
    readonly failure: CheckoutFailure,
    readonly fields: string[] = [],
  ) {
    super(failure);
    this.name = "CheckoutError";
  }
}

export class CheckoutApi {
  constructor(private readonly baseUrl: string) {}

  startPix(body: object): Promise<PixCharge> {
    return this.post<PixCharge>("/pix", body);
  }

  chargeCard(body: object): Promise<CardCharge> {
    return this.post<CardCharge>("/card", body);
  }

  async isPaid(orderId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${encodeURIComponent(orderId)}`, {
        cache: "no-store",
      });
      if (!response.ok) return false;
      return ((await response.json()) as { paid: boolean }).paid;
    } catch {
      return false;
    }
  }

  private async post<Result>(path: string, body: object): Promise<Result> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new CheckoutError("unavailable");
    }

    if (response.ok) return (await response.json()) as Result;
    throw new CheckoutError(failureOf(response.status), await invalidFieldsOf(response));
  }
}

function failureOf(status: number): CheckoutFailure {
  if (status === 400) return "invalid";
  if (status === 429) return "busy";
  if (status === 502) return "rejected";
  return "unavailable";
}

async function invalidFieldsOf(response: Response): Promise<string[]> {
  try {
    const { fields } = (await response.json()) as { fields?: unknown };
    return Array.isArray(fields) ? fields.filter((field): field is string => typeof field === "string") : [];
  } catch {
    return [];
  }
}
