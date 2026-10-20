import { AnalyticsEngineQueryError } from "@devlytics/adapters";
import { UnknownSiteError } from "@devlytics/core";
import { Hono } from "hono";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";
import { publicRead } from "../middleware/public-read";

export const demoRoutes = new Hono<AppEnv>().get("/demo", publicRead(300), async (c) => {
  try {
    return c.json(await buildContainer(c.env).getDemoOverview());
  } catch (error) {
    if (error instanceof UnknownSiteError) return c.json({ error: "demo_site_not_registered" }, 404);
    if (error instanceof AnalyticsEngineQueryError) return c.json({ error: "stats_unavailable" }, 502);
    throw error;
  }
});
