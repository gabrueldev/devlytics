import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../app-env";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export const sameOrigin = createMiddleware<AppEnv>(async (c, next) => {
  if (!safeMethods.has(c.req.method) && c.req.header("origin") !== c.env.APP_ORIGIN) {
    return c.json({ error: "cross_origin" }, 403);
  }
  return next();
});
