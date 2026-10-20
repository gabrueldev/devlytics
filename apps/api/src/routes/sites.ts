import { AnalyticsEngineQueryError } from "@devlytics/adapters";
import {
  DomainTakenError,
  InvalidDomainError,
  reportPeriods,
  SiteNotFoundError,
  type ReportPeriod,
} from "@devlytics/core";
import { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "../app-env";
import { buildContainer } from "../container";
import { requireSession } from "../middleware/session";

const newSiteSchema = z.object({
  name: z.string().max(200).default(""),
  domain: z.string().min(1).max(300),
});

export const siteRoutes = new Hono<AppEnv>()
  .use("/sites", requireSession)
  .use("/sites/*", requireSession)
  .post("/sites", async (c) => {
    const parsed = newSiteSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: "invalid_domain" }, 400);

    try {
      const site = await buildContainer(c.env).registerSite(c.get("userId"), parsed.data);
      return c.json({ id: site.id, name: site.name, domain: site.domain }, 201);
    } catch (error) {
      if (error instanceof InvalidDomainError) return c.json({ error: "invalid_domain" }, 400);
      if (error instanceof DomainTakenError) return c.json({ error: "domain_taken" }, 409);
      throw error;
    }
  })
  .delete("/sites/:siteId", async (c) => {
    try {
      await buildContainer(c.env).removeSite(c.get("userId"), c.req.param("siteId"));
      return c.body(null, 204);
    } catch (error) {
      if (error instanceof SiteNotFoundError) return c.json({ error: "site_not_found" }, 404);
      throw error;
    }
  })
  .get("/sites/:siteId/report", async (c) => {
    const days = periodOf(c.req.query("days"));
    try {
      return c.json(await buildContainer(c.env).getSiteReport(c.get("userId"), c.req.param("siteId"), days));
    } catch (error) {
      if (error instanceof SiteNotFoundError) return c.json({ error: "site_not_found" }, 404);
      if (error instanceof AnalyticsEngineQueryError) return c.json({ error: "stats_unavailable" }, 502);
      throw error;
    }
  });

function periodOf(value: string | undefined): ReportPeriod {
  return reportPeriods.find((days) => String(days) === value) ?? 7;
}
