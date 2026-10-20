import { PaymentRejectedError } from "@devlytics/core";
import { cardCoffeeRequestSchema, pixCoffeeRequestSchema } from "@devlytics/shared";
import { Hono, type Context } from "hono";
import type { z } from "zod";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";
import { checkoutGuard } from "../middleware/checkout-guard";

const orderIdPattern = /^[\w-]{1,64}$/;

export const coffeeCheckoutRoutes = new Hono<AppEnv>()
  .post("/coffees/pix", checkoutGuard, async (c) => {
    const request = await bodyOf(c, pixCoffeeRequestSchema);
    if (request === null) return c.json({ error: "invalid_request" }, 400);

    return charging(c, async () => {
      const charge = await buildContainer(c.env).chargePixCoffee({ ...request, ip: buyerIp(c) });
      return c.json(
        { orderId: charge.orderId, code: charge.code, expiresAt: charge.expiresAt.toISOString() },
        201,
      );
    });
  })
  .post("/coffees/card", checkoutGuard, async (c) => {
    const request = await bodyOf(c, cardCoffeeRequestSchema);
    if (request === null) return c.json({ error: "invalid_request" }, 400);

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

async function bodyOf<Schema extends z.ZodType>(
  c: Context<AppEnv>,
  schema: Schema,
): Promise<z.infer<Schema> | null> {
  try {
    const parsed = schema.safeParse(await c.req.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function charging(c: Context<AppEnv>, charge: () => Promise<Response>): Promise<Response> {
  try {
    return await charge();
  } catch (error) {
    if (error instanceof PaymentRejectedError) return c.json({ error: "payment_rejected" }, 502);
    throw error;
  }
}

function buyerIp(c: Context<AppEnv>): string | null {
  return c.req.header("cf-connecting-ip") ?? null;
}
