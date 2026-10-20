import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../app-env";

export const checkoutGuard = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.env.CAKTO_CLIENT_ID || !c.env.CAKTO_CLIENT_SECRET || !c.env.COFFEE_OFFER_ID)
    return c.body(null, 503);

  const { success } = await c.env.CHECKOUT_LIMIT.limit({
    key: c.req.header("cf-connecting-ip") ?? "unknown",
  });
  if (!success) return c.json({ error: "too_many_attempts" }, 429);

  return next();
});
