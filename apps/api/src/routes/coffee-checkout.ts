import { PaymentRejectedError } from "@devlytics/core";
import { cardCoffeeRequestSchema, pixCoffeeRequestSchema } from "@devlytics/shared";
import { Hono, type Context } from "hono";
import type { z } from "zod";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";
import { checkoutCors } from "../middleware/checkout-cors";
import { checkoutGuard } from "../middleware/checkout-guard";

const orderIdPattern = /^[\w-]{1,64}$/;

export const coffeeCheckoutRoutes = new Hono<AppEnv>()
  .use("/coffees/pix", checkoutCors)
  .use("/coffees/card", checkoutCors)
  .use("/coffees/orders/*", checkoutCors)
  .post("/coffees/pix", checkoutGuard, async (c) => {
    const parsed = await bodyOf(c, pixCoffeeRequestSchema);
    if (!parsed.success) return invalidRequest(c, parsed.fields);
    const request = parsed.data;

    return charging(c, async () => {
      const charge = await buildContainer(c.env).chargePixCoffee({ ...request, ip: buyerIp(c) });
      return c.json(
        { orderId: charge.orderId, code: charge.code, expiresAt: charge.expiresAt.toISOString() },
        201,
      );
    });
  })
  .post("/coffees/card", checkoutGuard, async (c) => {
    const parsed = await bodyOf(c, cardCoffeeRequestSchema);
    if (!parsed.success) return invalidRequest(c, parsed.fields);
    const request = parsed.data;

    return charging(c, async () => {
      const charge = await buildContainer(c.env).chargeCardCoffee({ ...request, ip: buyerIp(c) });
      return c.json(charge, 201);
    });
  })
  .get("/coffees/orders/:orderId", async (c) => {
    const orderId = c.req.param("orderId");
    if (!orderIdPattern.test(orderId)) return c.body(null, 404);

    c.header("cache-control", "no-store");
    return c.json({ paid: await buildContainer(c.env).isCoffeePaid(orderId) });
  });

type Parsed<Data> = { success: true; data: Data } | { success: false; fields: string[] };

async function bodyOf<Schema extends z.ZodType>(
  c: Context<AppEnv>,
  schema: Schema,
): Promise<Parsed<z.infer<Schema>>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return { success: false, fields: [] };
  }

  const parsed = schema.safeParse(body);
  if (parsed.success) return { success: true, data: parsed.data };
  return { success: false, fields: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))] };
}

function invalidRequest(c: Context<AppEnv>, fields: string[]): Response {
  console.warn("Invalid checkout request", { fields });
  return c.json({ error: "invalid_request", fields }, 400);
}

async function charging(c: Context<AppEnv>, charge: () => Promise<Response>): Promise<Response> {
  try {
    return await charge();
  } catch (error) {
    if (error instanceof PaymentRejectedError) {
      console.warn("Cakto rejected the charge", { status: error.status, detail: error.detail });
      return c.json({ error: "payment_rejected" }, 502);
    }
    throw error;
  }
}

function buyerIp(c: Context<AppEnv>): string | null {
  return c.req.header("cf-connecting-ip") ?? null;
}
