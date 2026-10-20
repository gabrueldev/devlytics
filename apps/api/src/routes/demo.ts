import { AnalyticsEngineQueryError } from "@devlytics/adapters";
import { UnknownSiteError } from "@devlytics/core";
import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";

const cacheSeconds = 300;

export const demoRoutes = new Hono<AppEnv>().use("/demo", cors({ origin: "*" })).get("/demo", async (c) => {
  const cache = caches.default;
  const cached = await cache.match(c.req.raw);
  if (cached) return cached;

  try {
    const overview = await buildContainer(c.env).getDemoOverview();
    const response = c.json(overview, 200, { "Cache-Control": `public, max-age=${cacheSeconds}` });
    c.executionCtx.waitUntil(cache.put(c.req.raw, response.clone()));
    return response;
  } catch (error) {
    if (error instanceof UnknownSiteError) return c.json({ error: "demo_site_not_registered" }, 404);
    if (error instanceof AnalyticsEngineQueryError) return c.json({ error: "stats_unavailable" }, 502);
    throw error;
  }
});
